"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DecryptTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  chars?: string;
}

export function DecryptText({
  text,
  speed = 40,
  maxIterations = 12,
  className = "",
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*",
}: DecryptTextProps) {
  const [display, setDisplay] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const decrypt = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let iteration = 0;
    const revealed = new Set<number>();

    intervalRef.current = setInterval(() => {
      // Reveal one more character
      if (revealed.size < text.length) {
        let nextIndex: number;
        do {
          nextIndex = Math.floor(Math.random() * text.length);
        } while (revealed.has(nextIndex) || text[nextIndex] === " ");
        revealed.add(nextIndex);
      }

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (revealed.has(i)) return text[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      iteration++;
      if (iteration >= maxIterations || revealed.size >= text.replace(/\s/g, "").length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, speed);
  }, [text, speed, maxIterations, chars]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplay(text);
  }, [text]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span
      className={`inline-block cursor-default ${className}`}
      onMouseEnter={() => {
        setIsHovering(true);
        decrypt();
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        reset();
      }}
    >
      {display}
    </span>
  );
}
