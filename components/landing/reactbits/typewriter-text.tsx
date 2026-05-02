"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TypewriterTextProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
  cursorClassName?: string;
  showCursor?: boolean;
  loop?: boolean;
}

export function TypewriterText({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2000,
  className = "",
  cursorClassName = "",
  showCursor = true,
  loop = true,
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const type = useCallback(() => {
    const fullText = texts[currentTextIndex];

    if (isPaused) {
      setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return;
    }

    if (isDeleting) {
      setCurrentText(fullText.substring(0, currentText.length - 1));

      if (currentText.length === 1) {
        setIsDeleting(false);
        const nextIndex = loop
          ? (currentTextIndex + 1) % texts.length
          : Math.min(currentTextIndex + 1, texts.length - 1);
        setCurrentTextIndex(nextIndex);
      }
    } else {
      setCurrentText(fullText.substring(0, currentText.length + 1));

      if (currentText.length + 1 === fullText.length) {
        setIsPaused(true);
      }
    }
  }, [currentText, currentTextIndex, isDeleting, isPaused, loop, pauseDuration, texts]);

  useEffect(() => {
    const timer = setTimeout(
      type,
      isPaused ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, type, deletingSpeed, typingSpeed, pauseDuration]);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentTextIndex + currentText}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          {currentText}
        </motion.span>
      </AnimatePresence>
      {showCursor && (
        <motion.span
          className={`inline-block w-[3px] h-[1em] ml-1 align-middle ${cursorClassName}`}
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{
            backgroundColor: "currentColor",
          }}
        />
      )}
    </span>
  );
}
