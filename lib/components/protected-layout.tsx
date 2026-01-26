"use client";

import React, { ReactNode } from "react";
import { withAuth } from "@/lib/hooks/with-auth";

// Context to share isLoggingOut ref with child components
export const LogoutFlagContext = React.createContext<{
  isLoggingOut: React.MutableRefObject<boolean>;
} | null>(null);

interface ProtectedLayoutInnerProps {
  children: ReactNode;
  isLoggingOut?: React.MutableRefObject<boolean>;
}

function ProtectedLayoutInner({
  children,
  isLoggingOut,
}: ProtectedLayoutInnerProps) {
  return (
    <LogoutFlagContext.Provider value={{ isLoggingOut: isLoggingOut! }}>
      {children}
    </LogoutFlagContext.Provider>
  );
}

// Wrap with auth HOC
const ProtectedLayoutWithAuth = withAuth(ProtectedLayoutInner);

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayoutWithAuth>{children}</ProtectedLayoutWithAuth>;
}
