import { Metadata } from "next";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorks,
  VideoSection,
  StatsSection,
  CTASection,
  Footer,
  MarqueeSection,
  TestimonialsSection,
} from "@/components/landing";
import { SplashCursorWrapper } from "@/components/landing/splash-cursor-wrapper";
import { ClickSpark } from "@/components/landing/reactbits/click-spark";

export const metadata: Metadata = {
  title: "Replium - AI Chatbot Platform for Modern Businesses",
  description:
    "Transform customer support with Replium. Build intelligent AI chatbots with custom training, real-time analytics, and seamless widget integration. Free to get started.",
  keywords: [
    "AI chatbot",
    "customer support",
    "chatbot platform",
    "Replium",
    "AI assistant",
    "chatbot widget",
    "analytics dashboard",
  ],
  openGraph: {
    title: "Replium - AI Chatbot Platform for Modern Businesses",
    description:
      "Transform customer support with intelligent AI chatbots. Custom training, real-time analytics, and seamless integration.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replium - AI Chatbot Platform",
    description: "Transform customer support with intelligent AI chatbots.",
  },
  alternates: {
    canonical: "/",
  },
};

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <main className="relative bg-white">
      <SplashCursorWrapper />
      <ClickSpark sparkColor="#d946ef" sparkCount={10} sparkRadius={20}>
        <Navbar />
        <HeroSection />
        <MarqueeSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorks />
        <VideoSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </ClickSpark>
    </main>
  );
}
