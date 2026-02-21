"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Loader, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await AuthService.generateOTP({
        email,
        purpose: "forgot_password",
      });

      toast.success("OTP has been sent to your email");
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&purpose=forgot_password`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="text-purple-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600">
            No worries! Enter your email and we'll send you a verification code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={20} />
                Sending Code...
              </span>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>

        {/* Sign Up Link */}
        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
