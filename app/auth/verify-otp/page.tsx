"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader, CheckCircle } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const OTP_TTL_SECONDS = 120;

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState<"register" | "forgot_password">("register");
  const [timeLeft, setTimeLeft] = useState(OTP_TTL_SECONDS);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const purposeParam = searchParams.get("purpose");
    
    if (emailParam) setEmail(emailParam);
    if (purposeParam === "register" || purposeParam === "forgot_password") {
      setPurpose(purposeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [timeLeft]);

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((d) => !d);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      toast.error("Validation Error", { description: "Please enter the complete 6-digit OTP" });
      return;
    }

    if (timeLeft <= 0) {
      toast.error("OTP Expired", { description: "Please request a new code" });
      return;
    }

    if (!email) {
      toast.error("Error", { description: "Email not found. Please try again." });
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.verifyOTP({
        email,
        otp: otpCode,
        purpose,
      });

      if (response.verified) {
        toast.success("Verified", { description: response.message });

        if (purpose === "register") {
          // Redirect to login after successful registration verification
          setTimeout(() => {
            router.push("/auth/login");
          }, 1500);
        } else if (purpose === "forgot_password" && response.reset_token) {
          // Redirect to reset password page with token
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("reset_token", response.reset_token);
            window.sessionStorage.setItem("reset_email", email);
          }
          router.push("/auth/reset-password");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OTP verification failed";
      toast.error("Verification Failed", { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Error", { description: "Email not found. Please try again." });
      return;
    }

    setResending(true);

    try {
      await AuthService.generateOTP({
        email,
        purpose,
      });
      
      toast.success("OTP Resent", { description: "A new code has been sent to your email" });
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
      setTimeLeft(OTP_TTL_SECONDS);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP";
      toast.error("Resend Failed", { description: errorMessage });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-gray-100/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
            <Mail className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            We've sent a 6-digit code to
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {email}
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Code expires in <span className="font-semibold text-gray-600">{formatTime(timeLeft)}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Input */}
          <div>
            <Label className="mb-3 text-center">
              Enter Verification Code
            </Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  disabled={loading || timeLeft <= 0}
                />
              ))}
            </div>
            {timeLeft <= 0 && (
              <p className="mt-3 text-xs text-rose-600">
                This code has expired. Please request a new one.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            disabled={loading || timeLeft <= 0 || otp.join("").length !== 6}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={20} />
                Verifying...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={20} />
                Verify Email
              </span>
            )}
          </Button>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || loading || timeLeft > 0}
              className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : timeLeft > 0
                ? `Resend available in ${formatTime(timeLeft)}`
                : "Resend Code"}
            </button>
          </div>
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

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin" size={40} />
      </div>
    }>
      <OTPVerificationContent />
    </Suspense>
  );
}
