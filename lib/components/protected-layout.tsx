"use client";

import React, { ReactNode } from "react";
import { withAuth } from "@/lib/hooks/with-auth";

function ProtectedLayoutInner({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Wrap with auth HOC
const ProtectedLayoutWithAuth = withAuth(ProtectedLayoutInner);

export function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayoutWithAuth>{children}</ProtectedLayoutWithAuth>;
}
