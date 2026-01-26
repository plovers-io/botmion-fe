"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { AuthFormProps, DummyUser } from "@/lib/types/form";

// Dummy user data for login
const DUMMY_USERS: DummyUser[] = [
  { email: "user@example.com", password: "password123", name: "John Doe" },
  { email: "test@test.com", password: "test123", name: "Test User" },
];

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
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email");
      setLoading(false);
      return;
    }

    // Check against dummy data
    const user = DUMMY_USERS.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      toast.success(`Welcome back, ${user.name}!`);
      login({ email: user.email, name: user.name });
      setEmail("");
      setPassword("");

      // Redirect to home page after brief delay
      setTimeout(() => {
        router.push("/home");
      }, 1500);
    } else {
      toast.error("Invalid email or password");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (name.length < 2) {
      toast.error("Name must be at least 2 characters");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (DUMMY_USERS.some((u) => u.email === email)) {
      toast.error("Email already registered. Please login instead.");
      setLoading(false);
      return;
    }

    toast.success("Account created successfully! Switching to login...");
    setName("");
    setEmail("");
    setPassword("");

    // Auto-switch to login after 2 seconds
    setTimeout(() => {
      onToggle();
    }, 2000);

    setLoading(false);
  };

  const handleSSOLogin = (provider: string) => {
    toast.info(`${provider} SSO login - Redirecting to ${provider}...`);
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
          onClick={() => handleSSOLogin("Google")}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <FaGoogle className="text-red-500" size={20} />
          <span className="text-sm font-medium">Google</span>
        </button>
        <button
          type="button"
          onClick={() => handleSSOLogin("Facebook")}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <FaFacebook className="text-blue-600" size={20} />
          <span className="text-sm font-medium">Facebook</span>
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

      {/* Dummy credentials hint */}
      {isLogin && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
          <strong>Demo credentials:</strong>
          <br />
          Email: user@example.com | Password: password123
          <br />
          Email: test@test.com | Password: test123
        </div>
      )}
    </div>
  );
};

export default AuthForm;
