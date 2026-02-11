"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store-v2";
import { toast } from "react-toastify";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, isLoggingOut } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (mounted && !isAuthenticated && !isLoggingOut) {
        // Only show error if NOT logging out intentionally
        toast.error("Please login first");
        router.push("/auth/login");
      } else if (mounted && !isAuthenticated && isLoggingOut) {
        // Silent redirect on logout
        router.push("/auth/login");
      }
    }, [isAuthenticated, router, mounted, isLoggingOut]);

    if (!mounted || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      );
    }

    // No need to pass isLoggingOut as prop anymore
    return <Component {...props} />;
  };
}
