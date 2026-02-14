"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { AuthService } from "@/lib/services/auth-service";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google login was cancelled or failed");
      router.push("/auth/login");
      return;
    }

    if (!code) {
      toast.error("No authorization code received");
      router.push("/auth/login");
      return;
    }

    const handleGoogleLogin = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const response = await AuthService.googleLogin({
          code,
          redirect_uri: redirectUri,
        });

        login(response);
        toast.success("Google login successful!");
        router.push("/home");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Google login failed";
        toast.error(errorMessage);
        router.push("/auth/login");
      } finally {
        setProcessing(false);
      }
    };

    handleGoogleLogin();
  }, [searchParams, login, router]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader className="animate-spin text-purple-600 mb-4" size={48} />
        <p className="text-gray-600 text-lg">Signing in with Google...</p>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="animate-spin" size={40} />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
