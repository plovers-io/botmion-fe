"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader, CheckCircle } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (!token) {
      toast.error("Invalid Link", { description: "This reset link is invalid or expired" });
      router.push("/auth/forgot-password");
      return;
    }
    
    setResetToken(token);
    if (emailParam) setEmail(emailParam);
  }, [searchParams, router]);

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Validation Error", { description: "Please fill in all fields" });
      return;
    }

    if (!validatePassword(password)) {
      toast.error("Validation Error", { description: "Password must be at least 8 characters long" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Validation Error", { description: "Passwords do not match" });
      return;
    }

    if (!resetToken) {
      toast.error("Token Missing", { description: "Please request a new reset link" });
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.resetPassword({
        reset_token: resetToken,
        new_password: password,
      });

      toast.success("Password Reset", { description: response.message || "Your password has been reset successfully" });
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Password reset failed";
      toast.error("Reset Failed", { description: errorMessage });
      
      // If token expired or invalid, redirect to forgot password
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        setTimeout(() => {
          router.push("/auth/forgot-password");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-gray-100/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
            <Lock className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter your new password below
          </p>
          {email && (
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1 text-sm">
              {email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <Label className="mb-2">
              New Password
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 py-5 rounded-xl"
                placeholder="Enter new password (min 8 characters)"
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

          {/* Confirm Password */}
          <div>
            <Label className="mb-2">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-12 py-5 rounded-xl"
                placeholder="Confirm your new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-xl p-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium mb-1">
              Password Requirements:
            </p>
            <ul className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1 ml-4 list-disc">
              <li>At least 8 characters long</li>
              <li>Mix of letters and numbers recommended</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={20} />
                Resetting Password...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={20} />
                Reset Password
              </span>
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin" size={40} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
