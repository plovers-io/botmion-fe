"use client";

import dynamic from "next/dynamic";

const SplashCursor = dynamic(
  () => import("./reactbits/splash-cursor").then((m) => m.SplashCursor),
  { ssr: false }
);

export function SplashCursorWrapper() {
  return <SplashCursor />;
}
