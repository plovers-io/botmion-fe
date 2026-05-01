"use client";

import Link from "next/link";
import { ArrowRight, Play, Zap, Shield, BarChart3 } from "lucide-react";
import { AnimatedText, GradientShimmerText, FadeIn } from "./animated-text";
import { DemoChat } from "./demo-chat";
import { Magnet } from "./reactbits/magnet";
import { RotatingText } from "./reactbits/rotating-text";
import { StarBorder } from "./reactbits/star-border";

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-24 sm:pt-32 pb-16 overflow-hidden bg-white">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text */}
          <div className="max-w-2xl">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-6">
                <Zap className="w-3.5 h-3.5" />
                Next-Gen AI Chatbot Platform
              </div>
            </FadeIn>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              <AnimatedText
                text="Transform Your"
                type="words"
                delay={0.2}
                staggerChildren={0.04}
              />
              <br />
              <span className="inline-flex flex-wrap items-center gap-x-3">
                <span className="text-slate-900">Customer</span>
                <span className="inline-block">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    <RotatingText
                      texts={["Experience", "Support", "Sales", "Engagement"]}
                      rotationInterval={2500}
                      staggerDuration={0.02}
                      mainClassName="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap"
                      elementLevelClassName="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent"
                    />
                  </span>
                </span>
              </span>
            </h1>

            <FadeIn delay={0.7}>
              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-lg">
                Replium powers your website with intelligent AI chatbots that
                understand, learn, and convert — built for speed, scale, and
                stunning results.
              </p>
            </FadeIn>

            <FadeIn delay={0.85}>
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Magnet padding={80} magnetStrength={2.5}>
                  <StarBorder
                    as="div"
                    color="#d946ef"
                    speed="4s"
                    thickness={2}
                    className="rounded-xl"
                  >
                    <Link
                      href="/auth/register"
                      className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all duration-200 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </StarBorder>
                </Magnet>
                <Magnet padding={80} magnetStrength={2.5}>
                  <StarBorder
                    as="div"
                    color="#d946ef"
                    speed="5s"
                    thickness={2}
                    className="rounded-xl"
                  >
                    <Link
                      href="#demo"
                      className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all duration-200"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                        <Play className="w-3 h-3 text-slate-600 ml-0.5" />
                      </span>
                      Watch Demo
                    </Link>
                  </StarBorder>
                </Magnet>
              </div>
            </FadeIn>

            <FadeIn delay={1}>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Enterprise-grade security</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Real-time analytics</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right: Demo Chat */}
          <div className="relative">
            <DemoChat />
          </div>
        </div>
      </div>
    </section>
  );
}
