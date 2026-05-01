import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ReactQueryProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Replium - AI Chatbot Platform for Modern Businesses",
  description:
    "Transform customer support with Replium. Build intelligent AI chatbots with custom training, real-time analytics, and seamless widget integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-300`}
      >
        <ReactQueryProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
