"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Wand2, Rocket, TrendingUp } from "lucide-react";
import { AnimatedText, FadeIn } from "./animated-text";
import { Magnet } from "./reactbits/magnet";
import { DecryptText } from "./reactbits/decrypt-text";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Data",
    description:
      "Import documents, FAQs, website content, or past conversations. Replium learns your business in seconds.",
    color: "bg-emerald-500",
    light: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Customize & Train",
    description:
      "Fine-tune tone, personality, and responses. Set guardrails and fallback behaviors to match your brand.",
    color: "bg-teal-500",
    light: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Deploy Anywhere",
    description:
      "Add one line of code to your website or use our no-code widget builder. Go live in under 5 minutes.",
    color: "bg-cyan-500",
    light: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-100",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Optimize & Scale",
    description:
      "Track performance, review conversations, and continuously improve with AI-powered recommendations.",
    color: "bg-sky-500",
    light: "bg-sky-50",
    text: "text-sky-600",
    border: "border-sky-100",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      className="relative"
    >
      {/* Connector line */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-slate-200 to-transparent" />
      )}

      <Magnet padding={80} magnetStrength={3} wrapperClassName="w-full">
        <div className="relative p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50 hover:-translate-y-1 group cursor-default h-full">
          {/* Hover gradient bg */}
          <div
            className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 bg-gradient-to-br ${step.color}`}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div
                className={`w-12 h-12 rounded-xl ${step.light} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-6 h-6 ${step.text}`} />
              </div>
              <span className="text-3xl font-black text-slate-100 select-none">
                {step.number}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              <DecryptText text={step.description} speed={35} maxIterations={10} />
            </p>
          </div>
        </div>
      </Magnet>
    </motion.div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeIn>
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-4">
              Simple Process
            </span>
          </FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            <AnimatedText text="From setup to live" type="words" />
            <br />
            <AnimatedText
              text="in four easy steps"
              type="words"
              delay={0.2}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent"
            />
          </h2>
          <FadeIn delay={0.3}>
            <p className="text-lg text-slate-500 mt-4">
              No complex setup. No engineering team required. Get your AI
              assistant running in minutes, not months.
            </p>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
