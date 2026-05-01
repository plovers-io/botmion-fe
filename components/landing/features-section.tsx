"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  MessageSquare,
  BrainCircuit,
  BarChart3,
  Code2,
  Globe,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";
import { AnimatedText, FadeIn } from "./animated-text";
import { Magnet } from "./reactbits/magnet";
import { ScrambleText } from "./reactbits/scramble-text";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chatbot",
    description:
      "Intelligent conversational AI that understands context, handles complex queries, and delivers human-like responses 24/7.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    priority: true,
  },
  {
    icon: BrainCircuit,
    title: "Custom Training Center",
    description:
      "Train your bot with your own data — documents, FAQs, URLs, and conversations. Fine-tune responses to match your brand voice perfectly.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    priority: true,
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Deep insights into every conversation. Track engagement, satisfaction, conversion rates, and bot performance in real-time.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    priority: true,
  },
  {
    icon: Code2,
    title: "Widget Embed",
    description:
      "Drop a single script tag into any website, CMS, or e-commerce platform. Live in minutes with zero coding required.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    priority: true,
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Communicate with customers in 50+ languages automatically. Break barriers and expand your global reach effortlessly.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    priority: false,
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant with end-to-end encryption, data privacy controls, and role-based access for complete peace of mind.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    priority: false,
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Sub-second response times powered by edge caching and optimized inference. Your users never wait.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    priority: false,
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Multiple team members, shared workspaces, conversation handoff, and internal notes for seamless support workflows.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    priority: false,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.215, 0.61, 0.355, 1],
      }}
    >
      <Magnet padding={80} magnetStrength={3} wrapperClassName="w-full">
        <div
          className={`group relative p-6 sm:p-7 rounded-2xl bg-white border ${feature.border} hover:border-transparent transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 h-full`}
        >
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className={`w-6 h-6 ${feature.color}`} />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              <ScrambleText text={feature.description} speed={25} />
            </p>
          </div>
        </div>
      </Magnet>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeIn>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
              Powerful Features
            </span>
          </FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            <AnimatedText text="Everything you need to" type="words" />
            <br />
            <AnimatedText
              text="scale customer conversations"
              type="words"
              delay={0.2}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent"
            />
          </h2>
          <FadeIn delay={0.3}>
            <p className="text-lg text-slate-500 mt-4">
              From intelligent AI responses to deep analytics — Replium gives
              you the complete toolkit to automate, analyze, and optimize.
            </p>
          </FadeIn>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
