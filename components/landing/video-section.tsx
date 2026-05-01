"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { AnimatedText, FadeIn } from "./animated-text";

export function VideoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [showModal, setShowModal] = useState(false);

  return (
    <section id="demo" className="relative py-24 sm:py-32 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeIn>
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-semibold mb-4">
              See it in Action
            </span>
          </FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            <AnimatedText text="Watch Replium transform" type="words" />
            <br />
            <AnimatedText
              text="customer support"
              type="words"
              delay={0.2}
              className="bg-gradient-to-r from-cyan-500 to-sky-500 bg-clip-text text-transparent"
            />
          </h2>
          <FadeIn delay={0.3}>
            <p className="text-lg text-slate-500 mt-4">
              See how easy it is to set up, customize, and deploy your AI
              chatbot in under 5 minutes.
            </p>
          </FadeIn>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          animate={
            isInView
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 50, scale: 0.97 }
          }
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-2xl" />

          <div
            className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl cursor-pointer group"
            onClick={() => setShowModal(true)}
          >
            {/* Thumbnail placeholder with gradient */}
            <div className="aspect-video relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
              {/* Abstract pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              </div>

              <div className="relative text-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                  whileHover={{ scale: 1.1 }}
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </motion.div>
                <p className="text-white/80 text-sm font-medium">
                  Watch the 2-minute demo
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/K6GOMfJo6Ic?autoplay=1&rel=0"
              title="Replium Demo"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
