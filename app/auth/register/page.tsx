"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Loader } from "lucide-react";
import { toast } from "react-toastify";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (
      !formData.email ||
      !formData.password ||
      !formData.first_name ||
      !formData.last_name
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!validatePassword(formData.password)) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: "individual",
      });
      
      toast.success(response.message || "Registration successful! Please check your email for OTP.");
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=register`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-6xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Image */}
          <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 p-8">
            <img
              src="/sign-up-illustration-svg-download-png-5230178.webp"
              alt="Sign up illustration"
              className="max-w-full h-auto object-contain"
            />
          </div>

          {/* Right Side - Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center max-h-screen overflow-y-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">Sign up to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your first name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your last name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your password (min 8 characters)"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={20} />
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
