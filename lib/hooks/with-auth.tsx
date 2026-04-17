"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store-v2";

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, isLoggingOut } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!mounted) return;

      // If user is not authenticated, always redirect to login.
      // This ensures that after logout, re-visiting any protected page
      // will force re-authentication.
      if (!isAuthenticated) {
        router.replace("/auth/login");
      }
    }, [isAuthenticated, router, mounted]);

    // Show nothing meaningful until hydrated and authenticated
    if (!mounted || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
