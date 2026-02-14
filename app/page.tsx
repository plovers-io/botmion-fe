import { redirect } from "next/navigation";

export default function RootPage() {
  // Server-side redirect — no client-side flash, no extra history entry
  redirect("/auth/login");
}
