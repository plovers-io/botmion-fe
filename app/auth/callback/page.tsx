"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import { goeyToast as toast } from "goey-toast";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { AuthService } from "@/lib/services/auth-service";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [processing, setProcessing] = useState(true);
  const hasRun = useRef(false);

  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (error) {
      toast.error("Login Failed", { description: "Google login was cancelled or failed" });
      setProcessing(false);
      router.push("/auth/login");
      return;
    }

    if (!code) {
      toast.error("Login Failed", { description: "No authorization code received" });
      setProcessing(false);
      router.push("/auth/login");
      return;
    }

    const handleGoogleLogin = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        let response = await AuthService.googleLogin({
          code,
          redirect_uri: redirectUri,
        });

        const emailPrefix = response.user?.email?.split("@")[0] ?? "";
        const firstName = response.user?.first_name?.trim() ?? "";
        if (emailPrefix && !firstName) {
          response = {
            ...response,
            user: {
              ...response.user,
              first_name: emailPrefix,
              last_name: response.user?.last_name ?? "",
            },
          };
        }

        login(response);
        toast.success("Welcome!", { description: "Google login successful" });
        router.push("/home");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Google login failed";
        toast.error("Login Failed", { description: errorMessage });
        router.push("/auth/login");
      } finally {
        setProcessing(false);
      }
    };

    handleGoogleLogin();
  }, [code, error, login, router]);

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
