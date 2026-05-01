"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader, CheckCircle } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import * as yup from "yup";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/common/password-strength";
import { getPasswordScore, PASSWORD_REQUIREMENTS } from "@/lib/utils/password";

const resetSchema = yup.object({
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Add at least one uppercase letter")
    .matches(/[a-z]/, "Add at least one lowercase letter")
    .matches(/\d/, "Add at least one number")
    .matches(/[^A-Za-z0-9]/, "Add at least one special character"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordScore = getPasswordScore(password);
  const passwordReady = passwordScore === PASSWORD_REQUIREMENTS.length;
  const confirmationReady = password && confirmPassword && password === confirmPassword;

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (typeof window !== "undefined") {
      if (tokenParam) {
        window.sessionStorage.setItem("reset_token", tokenParam);
        setResetToken(tokenParam);
      }
      if (emailParam) {
        window.sessionStorage.setItem("reset_email", emailParam);
        setEmail(emailParam);
      }
    }

    if (tokenParam || emailParam) {
      router.replace("/auth/reset-password");
      return;
    }

    if (typeof window !== "undefined") {
      const storedToken = window.sessionStorage.getItem("reset_token");
      const storedEmail = window.sessionStorage.getItem("reset_email");

      if (storedToken) {
        setResetToken(storedToken);
      }
      if (storedEmail) {
        setEmail(storedEmail);
      }

      if (!storedToken) {
        toast.error("Invalid Link", {
          description: "This reset link is invalid or expired",
        });
        router.push("/auth/forgot-password");
      }
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    try {
      await resetSchema.validate({ password, confirmPassword }, { abortEarly: false });
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

    if (!resetToken) {
      toast.error("Token Missing", { description: "Please request a new reset link" });
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.resetPassword({
        reset_token: resetToken,
        new_password: password,
        confirm_password: confirmPassword,
      });

      toast.success("Password Reset", { description: response.message || "Your password has been reset successfully" });

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("reset_token");
        window.sessionStorage.removeItem("reset_email");
      }
      
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-gray-100/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
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
                onFocus={() => setShowPasswordStrength(true)}
                onBlur={() => setShowPasswordStrength(false)}
                className={`pl-10 pr-12 py-5 rounded-xl ${
                  errors.password ? "border-rose-500 focus-visible:ring-rose-500" : ""
                }`}
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
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
            )}
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
                className={`pl-10 pr-12 py-5 rounded-xl ${
                  errors.confirmPassword
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : ""
                }`}
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
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {showPasswordStrength && password && <PasswordStrength password={password} />}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !passwordReady || !confirmationReady}
            className="w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
