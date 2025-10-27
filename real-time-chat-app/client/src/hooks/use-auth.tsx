import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { storeKeys, generateKeyPair, getKeys } from "@/lib/crypto";

interface User {
  id: number;
  username: string;
  fullName?: string | null;
  email?: string | null;
  avatar?: string | null;
  gender?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName?: string, email?: string, avatar?: string, gender?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: async () => {
      console.log("🔐 Login successful - starting key upload process...");
      
      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate or get encryption keys
      let keys = getKeys();
      if (!keys) {
        console.log("🔑 No existing keys found - generating new keys...");
        keys = generateKeyPair();
        storeKeys(keys.publicKey, keys.secretKey);
        console.log("✅ New keys generated and stored in localStorage");
      } else {
        console.log("✅ Found existing keys in localStorage");
      }
      
      // Always upload public key to server on every login
      // This ensures the database is always up-to-date
      console.log("📤 Uploading public key to server...");
      try {
        const res = await fetch("/api/user/public-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: keys.publicKey }),
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Failed to upload public key - Status:", res.status, "Error:", errorText);
        } else {
          const result = await res.json();
          console.log("✅ Public key uploaded successfully:", result.message);
        }
      } catch (error) {
        console.error("❌ Exception during public key upload:", error);
      }
      
      // Refetch user data immediately after successful login
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, password, fullName, email, avatar, gender }: { username: string; password: string; fullName?: string; email?: string; avatar?: string; gender?: string }) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, fullName, email, avatar, gender }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: async (data) => {
      console.log("🔐 Registration successful - starting key generation...");
      
      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate client-side encryption keys
      console.log("🔑 Generating new encryption keys...");
      const clientKeys = generateKeyPair();
      storeKeys(clientKeys.publicKey, clientKeys.secretKey);
      console.log("✅ Keys generated and stored in localStorage");
      
      // Send public key to server
      console.log("📤 Uploading public key to server...");
      try {
        const res = await fetch("/api/user/public-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: clientKeys.publicKey }),
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ Failed to upload public key during registration - Status:", res.status, "Error:", errorText);
        } else {
          const result = await res.json();
          console.log("✅ Public key uploaded successfully during registration:", result.message);
        }
      } catch (error) {
        console.error("❌ Exception during public key upload (registration):", error);
      }
      
      // Refetch user data immediately after successful registration
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      return res.json();
    },
    onSuccess: () => {
      // Clear all queries from the cache
      queryClient.clear();
      // Set the user query to null explicitly
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (username: string, password: string, fullName?: string, email?: string, avatar?: string, gender?: string) => {
    await registerMutation.mutateAsync({ username, password, fullName, email, avatar, gender });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // In some edge cases (HMR/react-refresh or async navigation) a hook may be
    // invoked before the provider is mounted. Rather than crashing the app,
    // return a safe fallback context and log a warning. The provider will
    // replace this when it mounts.
    console.warn("useAuth called outside AuthProvider — returning fallback (isLoading: true)");
    return {
      user: null,
      isLoading: true,
      login: async () => { throw new Error("AuthProvider not ready"); },
      register: async () => { throw new Error("AuthProvider not ready"); },
      logout: async () => { throw new Error("AuthProvider not ready"); },
    } as AuthContextType;
  }
  return context;
}
