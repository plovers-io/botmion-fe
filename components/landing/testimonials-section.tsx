"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";
import { AnimatedText, FadeIn } from "./animated-text";
import { Magnet } from "./reactbits/magnet";

const testimonials = [
  {
    quote:
      "Replium reduced our support tickets by 70% in the first month. The AI actually understands our product better than some of our human agents.",
    author: "Sarah Chen",
    role: "Head of Customer Success",
    company: "TechFlow",
    rating: 5,
  },
  {
    quote:
      "Setup took literally 4 minutes. We uploaded our docs, customized the tone, and had a bot answering questions that same afternoon.",
    author: "Marcus Johnson",
    role: "CEO",
    company: "NexusAI",
    rating: 5,
  },
  {
    quote:
      "The analytics dashboard is incredible. We can see exactly what customers are asking, where they get stuck, and how satisfied they are.",
    author: "Aisha Patel",
    role: "Product Manager",
    company: "CloudPeak",
    rating: 5,
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.5,
        delay: index * 0.15,
        ease: [0.215, 0.61, 0.355, 1],
      }}
    >
      <Magnet padding={80} magnetStrength={3} wrapperClassName="w-full">
        <div className="relative p-6 sm:p-8 rounded-2xl bg-white border border-slate-100 hover:border-fuchsia-200 transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-100/30 hover:-translate-y-1 h-full group">
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 text-amber-400 fill-amber-400"
              />
            ))}
          </div>

          <Quote className="w-8 h-8 text-fuchsia-200 mb-3 group-hover:text-fuchsia-300 transition-colors" />

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            &ldquo;{testimonial.quote}&rdquo;
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
              {testimonial.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {testimonial.author}
              </p>
              <p className="text-xs text-slate-400">
                {testimonial.role} at {testimonial.company}
              </p>
            </div>
          </div>
        </div>
      </Magnet>
    </motion.div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeIn>
            <span className="inline-block px-3 py-1 rounded-full bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-700 text-xs font-semibold mb-4">
              Customer Stories
            </span>
          </FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            <AnimatedText text="Loved by teams" type="words" />
            <br />
            <AnimatedText
              text="who ship fast"
              type="words"
              delay={0.2}
              className="bg-gradient-to-r from-fuchsia-500 to-pink-500 bg-clip-text text-transparent"
            />
          </h2>
          <FadeIn delay={0.3}>
            <p className="text-lg text-slate-500 mt-4">
              See why thousands of businesses trust Replium to handle their
              customer conversations.
            </p>
          </FadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.author} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
