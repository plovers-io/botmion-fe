"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AnimatedText, FadeIn } from "./animated-text";
import { Magnet } from "./reactbits/magnet";
import { StarBorder } from "./reactbits/star-border";

export function CTASection() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Start for free today
          </div>
        </FadeIn>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-6">
          <AnimatedText
            text="Ready to revolutionize"
            type="words"
            className="text-white"
          />
          <br />
          <AnimatedText
            text="your customer support?"
            type="words"
            delay={0.2}
            className="text-white"
          />
        </h2>

        <FadeIn delay={0.4}>
          <p className="text-lg text-emerald-50 max-w-2xl mx-auto mb-10">
            Join thousands of businesses using Replium to automate
            conversations, capture leads, and delight customers around the
            clock.
          </p>
        </FadeIn>

        <FadeIn delay={0.55}>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
                  className="group inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-emerald-700 bg-white hover:bg-emerald-50 rounded-xl transition-all duration-200 shadow-xl shadow-black/10"
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
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200"
                >
                  Login to Dashboard
                </Link>
              </StarBorder>
            </Magnet>
          </div>
        </FadeIn>

        <FadeIn delay={0.7}>
          <p className="text-xs text-emerald-100/70 mt-6">
            No credit card required. Free tier includes 1,000 conversations/month.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
