"use client";

import { motion } from "framer-motion";
import { FadeIn } from "./animated-text";

const companies = [
  "TechFlow",
  "NexusAI",
  "CloudPeak",
  "DataPulse",
  "SynthWave",
  "ByteForge",
  "NeuralNet",
  "QuantumLabs",
];

export function MarqueeSection() {
  return (
    <section className="relative py-12 sm:py-16 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <FadeIn>
          <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-widest">
            Trusted by innovative teams worldwide
          </p>
        </FadeIn>
      </div>

      <div className="relative flex overflow-hidden">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Marquee track */}
        <motion.div
          className="flex gap-12 sm:gap-20 items-center shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[...companies, ...companies].map((company, i) => (
            <div
              key={i}
              className="flex items-center gap-3 shrink-0 opacity-40 hover:opacity-80 transition-opacity duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                {company.slice(0, 2)}
              </div>
              <span className="text-lg font-semibold text-slate-600 whitespace-nowrap">
                {company}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
