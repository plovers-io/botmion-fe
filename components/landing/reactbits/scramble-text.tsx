"use client";

import { useState, useCallback, useRef, ReactNode } from "react";
import { motion } from "framer-motion";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number;
  as?: "p" | "span" | "h3" | "div";
}

export function ScrambleText({
  text,
  className = "",
  speed = 30,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const totalIterations = text.length * 3;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration / 3) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iteration++;

      if (iteration >= totalIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplay(text);
        setIsScrambling(false);
      }
    }, speed);
  }, [text, speed, isScrambling]);

  const stopScramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplay(text);
    setIsScrambling(false);
  }, [text]);

  return (
    <motion.span
      className={`inline-block ${className}`}
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Tag className="inline">{display}</Tag>
    </motion.span>
  );
}

interface ScrambleRevealProps {
  children: ReactNode;
  className?: string;
}

export function ScrambleReveal({ children, className = "" }: ScrambleRevealProps) {
  return (
    <span className={`group ${className}`}>
      {children}
    </span>
  );
}
