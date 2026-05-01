"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const demoMessages: Message[] = [
  {
    id: 1,
    role: "user",
    text: "How can I integrate Replium into my website?",
  },
  {
    id: 2,
    role: "assistant",
    text: "Integrating Replium is super easy! Just add our widget script to your HTML, train your bot with your data, and you're live in under 5 minutes. No coding required!",
  },
  {
    id: 3,
    role: "user",
    text: "Can it handle multiple languages?",
  },
  {
    id: 4,
    role: "assistant",
    text: "Absolutely! Replium supports 50+ languages natively. Your customers can chat in their preferred language, and the bot responds fluently every time.",
  },
  {
    id: 5,
    role: "user",
    text: "What about analytics?",
  },
  {
    id: 6,
    role: "assistant",
    text: "Our real-time dashboard gives you deep insights — conversation trends, user satisfaction, lead capture rates, and more. Data-driven decisions made simple!",
  },
];

function TypingDots() {
  return (
    <div className="flex gap-1 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function DemoChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIndex >= demoMessages.length) {
      const restart = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 6000);
      return () => clearTimeout(restart);
    }

    const msg = demoMessages[currentIndex];
    const delay = currentIndex === 0 ? 800 : 1500;

    const timer = setTimeout(() => {
      if (msg.role === "assistant") {
        setTypingId(msg.id);
        const typingTimer = setTimeout(() => {
          setTypingId(null);
          setVisibleMessages((prev) => [...prev, msg]);
          setCurrentIndex((prev) => prev + 1);
        }, 1800);
        return () => clearTimeout(typingTimer);
      } else {
        setVisibleMessages((prev) => [...prev, msg]);
        setCurrentIndex((prev) => prev + 1);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, typingId]);

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-60" />

      <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Replium Assistant</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online now
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400 ml-auto" />
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="h-[320px] overflow-y-auto px-4 py-4 space-y-3 no-scrollbar"
        >
          <AnimatePresence mode="popLayout">
            {visibleMessages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-slate-100"
                      : "bg-gradient-to-br from-emerald-500 to-cyan-500"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-br-md"
                      : "bg-slate-50 text-slate-700 rounded-bl-md border border-slate-100"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {typingId !== null && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
            <span className="text-sm text-slate-300">Type a message...</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
