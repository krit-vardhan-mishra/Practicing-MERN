import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { generateKeyPair, getKeys, storeKeys } from "@/lib/crypto";
import { Button } from "@/components/ui/button";

export default function SetupKeysPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>("Checking keys...");
  const [hasLocalKeys, setHasLocalKeys] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    checkKeys();
  }, [user]);

  const checkKeys = async () => {
    // Check local keys
    const localKeys = getKeys();
    setHasLocalKeys(!!localKeys);

    if (!user) {
      setStatus("Not logged in");
      return;
    }

    // Check server key
    try {
      const res = await fetch("/api/user/public-key/status", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setHasServerKey(data.hasPublicKey);
        
        if (localKeys && data.hasPublicKey) {
          setStatus("✅ All set! Both local and server keys exist.");
        } else if (localKeys && !data.hasPublicKey) {
          setStatus("⚠️ Local keys exist but server key is missing. Click 'Upload Key' to fix.");
        } else if (!localKeys && data.hasPublicKey) {
          setStatus("⚠️ Server key exists but local keys are missing. Click 'Generate Keys' to fix.");
        } else {
          setStatus("❌ No keys found. Click 'Generate & Upload Keys' to create them.");
        }
      }
    } catch (error) {
      console.error("Error checking keys:", error);
      setStatus("❌ Error checking keys");
    }
  };

  const handleGenerateAndUpload = async () => {
    setIsUploading(true);
    setStatus("Generating keys...");

    try {
      // Generate new keys
      const keys = generateKeyPair();
      storeKeys(keys.publicKey, keys.secretKey);
      setHasLocalKeys(true);
      setStatus("Keys generated! Uploading to server...");

      // Upload public key
      const res = await fetch("/api/user/public-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: keys.publicKey }),
        credentials: "include",
      });

      if (res.ok) {
        setHasServerKey(true);
        setStatus("✅ Success! Keys generated and uploaded.");
      } else {
        const error = await res.text();
        setStatus(`❌ Failed to upload: ${error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadOnly = async () => {
    const keys = getKeys();
    if (!keys) {
      setStatus("❌ No local keys found. Generate keys first.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading public key...");

    try {
      const res = await fetch("/api/user/public-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: keys.publicKey }),
        credentials: "include",
      });

      if (res.ok) {
        setHasServerKey(true);
        setStatus("✅ Public key uploaded successfully!");
      } else {
        const error = await res.text();
        setStatus(`❌ Failed to upload: ${error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D1117]">
        <div className="text-[#C9D1D9]">Please login first</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[#0D1117] p-4">
      <div className="max-w-md w-full bg-[#161B22] p-8 rounded-lg border border-[#30363D]">
        <h1 className="text-2xl font-bold text-[#C9D1D9] mb-4">
          🔐 Encryption Keys Setup
        </h1>
        
        <div className="mb-6">
          <p className="text-[#8B949E] mb-2">User: {user.username}</p>
          <p className="text-[#8B949E] mb-2">
            Local Keys: {hasLocalKeys ? "✅ Found" : "❌ Missing"}
          </p>
          <p className="text-[#8B949E] mb-4">
            Server Key: {hasServerKey ? "✅ Found" : "❌ Missing"}
          </p>
          
          <div className="bg-[#0D1117] p-4 rounded border border-[#30363D]">
            <p className="text-[#C9D1D9] text-sm">{status}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGenerateAndUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? "Processing..." : "Generate & Upload Keys"}
          </Button>

          {hasLocalKeys && !hasServerKey && (
            <Button
              onClick={handleUploadOnly}
              disabled={isUploading}
              variant="outline"
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload Existing Key"}
            </Button>
          )}

          <Button
            onClick={checkKeys}
            variant="outline"
            className="w-full"
          >
            Refresh Status
          </Button>
        </div>

        <div className="mt-6 p-4 bg-[#0D1117] rounded border border-[#30363D]">
          <p className="text-xs text-[#8B949E]">
            <strong>Note:</strong> Both users need encryption keys to exchange messages.
            If you see "Failed to fetch recipient public key", the other user needs to
            setup their keys too.
          </p>
        </div>

        <Button
          onClick={() => window.location.href = "/chat"}
          variant="link"
          className="w-full mt-4"
        >
          ← Back to Chat
        </Button>
      </div>
    </div>
  );
}
