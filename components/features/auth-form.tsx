"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { AuthService } from "@/lib/services/auth-service";
import { AuthFormProps } from "@/lib/types/form";

const AuthForm: React.FC<AuthFormProps> = ({ isLogin, onToggle }) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.login({ email, password });
      
      // Update auth store with real API response
      login(response);
      
      toast.success(`Welcome back, ${response.user.first_name}!`);
      setEmail("");
      setPassword("");

      // Redirect to home page
      setTimeout(() => {
        router.push("/home");
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // Split name into first and last name
      const nameParts = name.trim().split(" ");
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" ") || nameParts[0];

      const response = await AuthService.register({
        email,
        password,
        first_name,
        last_name,
        user_type: "individual"
      });
      
      toast.success(response.message || "Registration successful! Please check your email for OTP.");
      
      const signupEmail = email;

      setName("");
      setEmail("");
      setPassword("");

      // Redirect to OTP verification
      setTimeout(() => {
        router.push(`/auth/verify-otp?email=${encodeURIComponent(signupEmail)}&purpose=register`);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    toast.info("Google SSO integration - Coming soon!");
    // TODO: Implement Google OAuth flow
    // Backend endpoints available:
    // - GET /api/user/v1/auth/google/url/
    // - POST /api/user/v1/auth/google/login/
  };

  return (
    <div className="w-full">
      <form
        onSubmit={isLogin ? handleLogin : handleSignup}
        className="space-y-4"
      >
        {/* Name field - only for signup */}
        {!isLogin && (
          <div className="relative">
            <div className="absolute left-3 top-3 text-violet-500">
              <User size={20} />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
            />
          </div>
        )}

        {/* Email field */}
        <div className="relative">
          <div className="absolute left-3 top-3 text-violet-500">
            <Mail size={20} />
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          />
        </div>

        {/* Password field */}
        <div className="relative">
          <div className="absolute left-3 top-3 text-violet-500">
            <Lock size={20} />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-violet-500 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 text-white py-2 rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Processing...
            </>
          ) : isLogin ? (
            "Login"
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">Or continue with</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* SSO Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <FaGoogle className="text-red-500" size={20} />
          <span className="text-sm font-medium">Google</span>
        </button>
      </div>

      {/* Toggle link */}
      <div className="text-center mt-6 text-sm text-gray-600">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={onToggle}
          className="text-violet-600 font-semibold hover:text-violet-700 transition"
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </div>

      {/* Forgot Password Link */}
      {isLogin && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => router.push("/auth/forgot-password")}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
