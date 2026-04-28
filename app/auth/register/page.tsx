"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User, Loader } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import * as yup from "yup";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/common/password-strength";
import { getPasswordScore, PASSWORD_REQUIREMENTS } from "@/lib/utils/password";

const registerSchema = yup.object({
  first_name: yup
    .string()
    .trim()
    .required("First name is required")
    .max(60, "First name is too long")
    .matches(/^[^<>]*$/, "First name contains invalid characters"),
  last_name: yup
    .string()
    .trim()
    .required("Last name is required")
    .max(60, "Last name is too long")
    .matches(/^[^<>]*$/, "Last name contains invalid characters"),
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .email("Please enter a valid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Add at least one uppercase letter")
    .matches(/[a-z]/, "Add at least one lowercase letter")
    .matches(/\d/, "Add at least one number")
    .matches(/[^A-Za-z0-9]/, "Add at least one special character"),
});

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordScore = getPasswordScore(formData.password);
  const passwordReady = passwordScore === PASSWORD_REQUIREMENTS.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      await registerSchema.validate(formData, { abortEarly: false });
    } catch (validationError) {
      if (validationError instanceof yup.ValidationError) {
        const nextErrors: Record<string, string> = {};
        validationError.inner.forEach((issue) => {
          if (issue.path && !nextErrors[issue.path]) {
            nextErrors[issue.path] = issue.message;
          }
        });
        setErrors(nextErrors);
      }
      toast.error("Validation Error", {
        description: "Please review the highlighted fields",
      });
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
      
      toast.success("Registration Successful", { description: response.message || "Please check your email for OTP" });
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=register`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error("Registration Failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-6xl shadow-2xl overflow-hidden border-gray-100/50 dark:border-gray-700/50">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Image */}
          <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 p-8">
            <img
              src="/sign-up-illustration-svg-download-png-5230178.webp"
              alt="Sign up illustration"
              className="max-w-full h-auto object-contain"
            />
          </div>

          {/* Right Side - Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center max-h-screen overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <User className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Create Account
              </h1>
              <p className="text-gray-500 dark:text-gray-400">Sign up to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name */}
          <div>
            <Label className="mb-2">
              First Name
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`pl-10 py-5 rounded-xl ${
                  errors.first_name ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
                placeholder="Enter your first name"
                disabled={loading}
              />
            </div>
            {errors.first_name && (
              <p className="mt-1 text-xs text-rose-600">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <Label className="mb-2">
              Last Name
            </Label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`pl-10 py-5 rounded-xl ${
                  errors.last_name ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
                placeholder="Enter your last name"
                disabled={loading}
              />
            </div>
            {errors.last_name && (
              <p className="mt-1 text-xs text-rose-600">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label className="mb-2">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`pl-10 py-5 rounded-xl ${
                  errors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label className="mb-2">
              Password
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`pl-10 pr-12 py-5 rounded-xl ${
                  errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
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
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
            )}
            <div className="mt-3">
              <PasswordStrength password={formData.password} />
            </div>
          </div>

          {/* Register Button */}
          <Button
            type="submit"
            disabled={loading || !passwordReady}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-gray-500">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
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
