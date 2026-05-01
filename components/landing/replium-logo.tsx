"use client";

import { motion } from "framer-motion";

interface RepliumLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function RepliumLogo({
  className = "",
  size = 40,
  showText = true,
  textClassName = "",
}: RepliumLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="repliumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="repliumGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer chat-bubble hexagon hybrid */}
        <motion.path
          d="M24 2L42 12V32L24 44L6 32V12L24 2Z"
          fill="url(#repliumGradient)"
          fillOpacity="0.1"
          stroke="url(#repliumGradient)"
          strokeWidth="2"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Inner geometric R */}
        <motion.g
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
          filter="url(#glow)"
        >
          {/* R vertical stem */}
          <rect x="14" y="12" width="5" height="24" rx="1" fill="url(#repliumGradient2)" />
          {/* R top curve */}
          <path
            d="M19 12H26C30.4 12 34 15.6 34 20C34 24.4 30.4 28 26 28H19"
            fill="none"
            stroke="url(#repliumGradient2)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* R diagonal leg */}
          <path
            d="M26 28L34 38"
            stroke="url(#repliumGradient2)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </motion.g>

        {/* AI pulse dot */}
        <motion.circle
          cx="38"
          cy="8"
          r="4"
          fill="#10b981"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{
            delay: 1,
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx="38"
          cy="8"
          r="4"
          fill="#10b981"
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{
            delay: 1,
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      </svg>
      {showText && (
        <span
          className={`text-xl font-bold tracking-tight gradient-text ${textClassName}`}
        >
          Replium
        </span>
      )}
    </div>
  );
}
