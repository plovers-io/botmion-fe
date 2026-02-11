"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { AuthService } from "@/lib/services/auth-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState<"register" | "forgot_password">("register");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const purposeParam = searchParams.get("purpose") as "register" | "forgot_password";
    
    if (emailParam) setEmail(emailParam);
    if (purposeParam) setPurpose(purposeParam);
  }, [searchParams]);

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
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    if (!email) {
      toast.error("Email not found. Please try again.");
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
        toast.success(response.message);

        if (purpose === "register") {
          // Redirect to login after successful registration verification
          setTimeout(() => {
            router.push("/auth/login");
          }, 1500);
        } else if (purpose === "forgot_password" && response.reset_token) {
          // Redirect to reset password page with token
          router.push(`/auth/reset-password?token=${response.reset_token}&email=${encodeURIComponent(email)}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OTP verification failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email not found. Please try again.");
      return;
    }

    setResending(true);

    try {
      await AuthService.generateOTP({
        email,
        purpose,
      });
      
      toast.success("OTP has been resent to your email");
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP";
      toast.error(errorMessage);
    } finally {
      setResending(false);
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
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to
          </p>
          <p className="text-purple-600 font-semibold mt-1">
            {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
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
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-gray-600 text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || loading}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend Code"}
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
