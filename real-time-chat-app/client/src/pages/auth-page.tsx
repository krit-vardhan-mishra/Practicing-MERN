import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Eye, EyeOff, User } from "lucide-react";
import Avatar from "react-nice-avatar";
import AvatarEditor from "@/components/avatar-editor";

interface AuthFormData {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  gender?: string;
  avatar?: string;
}

interface AuthPageState {
  isLogin: boolean;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
  showAvatarEditor: boolean;
}

export default function AuthPage() {
  const [state, setState] = useState<AuthPageState>({
    isLogin: true,
    showPassword: false,
    error: "",
    isLoading: false,
    showAvatarEditor: false,
  });

  const { register: registerField, handleSubmit, watch, setValue, reset } = useForm<AuthFormData>({
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      gender: "",
      avatar: "",
    },
  });

  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  const avatar = watch("avatar");
  const gender = watch("gender");

  const onSubmit = async (data: AuthFormData) => {
    setState((prev) => ({ ...prev, error: "", isLoading: true }));

    try {
      // Force username to lowercase to avoid case issues in DB and login
      const username = (data.username || "").trim().toLowerCase();
      const password = data.password;
      if (state.isLogin) {
        await login(username, password);
      } else {
        // Generate default avatar based on gender if not selected
        const finalAvatar = data.avatar || (data.gender ? JSON.stringify({ sex: data.gender === "male" ? "man" : "woman" }) : "");
        await register(username, password, data.fullName, data.email, finalAvatar, data.gender);
      }
      setLocation("/");
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message || "An error occurred" }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const toggleAuthMode = () => {
    setState((prev) => ({ ...prev, isLogin: !prev.isLogin, error: "" }));
    reset();
  };

  const togglePasswordVisibility = () => {
    setState((prev) => ({ ...prev, showPassword: !prev.showPassword }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1117]">
      <div className="w-full max-w-md p-8 space-y-6 bg-[#161B22] rounded-xl shadow-2xl border border-[#30363D]">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#238636] rounded-xl mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#C9D1D9]">
            {state.isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-2 text-gray-400">
            {state.isLogin ? "Sign in to your real-time chat" : "Join the conversation today"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!state.isLogin && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#C9D1D9] mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  {...registerField("fullName")}
                  className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-[#238636] focus-visible:border-[#238636]"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#C9D1D9] mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...registerField("email")}
                  className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-[#238636] focus-visible:border-[#238636]"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[#C9D1D9] mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  {...registerField("gender")}
                  className="flex h-10 w-full rounded-md border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#C9D1D9] ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238636] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="bg-[#161B22]">Select gender</option>
                  <option value="male" className="bg-[#161B22]">Male</option>
                  <option value="female" className="bg-[#161B22]">Female</option>
                  <option value="other" className="bg-[#161B22]">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#C9D1D9] mb-2">
                  Avatar (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {avatar && (
                    <Avatar 
                      className="w-16 h-16 rounded-full ring-2 ring-[#30363D]" 
                      {...JSON.parse(avatar)} 
                    />
                  )}
                  <Button
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, showAvatarEditor: true }))}
                    variant="outline"
                    className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] hover:bg-[#30363D] hover:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {avatar ? "Edit Avatar" : "Create Avatar"}
                  </Button>
                </div>
                {!avatar && gender && (
                  <p className="mt-2 text-xs text-gray-500">
                    A default avatar will be assigned based on your gender
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[#C9D1D9] mb-2">
              Username
            </label>
            <Input
              id="username"
              type="text"
              {...registerField("username", { required: true })}
              className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-[#238636] focus-visible:border-[#238636]"
              placeholder="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#C9D1D9] mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={state.showPassword ? "text" : "password"}
                {...registerField("password", { required: true })}
                className="bg-[#0D1117] border-[#30363D] text-[#C9D1D9] placeholder:text-gray-500 focus-visible:ring-[#238636] focus-visible:border-[#238636] pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C9D1D9] transition-colors"
              >
                {state.showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {state.error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 rounded-lg border border-red-800/30">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={state.isLoading}
            className="w-full bg-[#238636] hover:bg-[#238636]/90 text-white font-medium"
          >
            {state.isLoading ? "Please wait..." : state.isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#30363D]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#161B22] px-2 text-gray-500">Or</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={toggleAuthMode}
            type="button"
            className="text-sm text-[#238636] hover:text-[#238636]/80 transition-colors"
          >
            {state.isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      {/* Avatar Editor Modal */}
      {state.showAvatarEditor && (
        <AvatarEditor
          initialConfig={avatar || ""}
          onSave={(config) => setValue("avatar", config)}
          onClose={() => setState((prev) => ({ ...prev, showAvatarEditor: false }))}
        />
      )}
    </div>
  );
}
