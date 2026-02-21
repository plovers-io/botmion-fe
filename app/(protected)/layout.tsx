import { ProtectedLayout } from "@/lib/components/protected-layout";
import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
