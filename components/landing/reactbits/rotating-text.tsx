"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { motion, AnimatePresence, type Transition, type TargetAndTransition } from "framer-motion";

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface RotatingTextProps {
  texts: string[];
  transition?: Transition;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  animatePresenceMode?: "wait" | "sync";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}

export const RotatingText = forwardRef<
  { next: () => void; previous: () => void; jumpTo: (index: number) => void; reset: () => void },
  RotatingTextProps
>((props, ref) => {
  const {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial: initialProp = { y: "100%", opacity: 0 },
    animate: animateProp = { y: 0, opacity: 1 },
    exit: exitProp = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = "first",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    colors,
    animationSpeed = 5,
    showBorder = false,
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text: string) => {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      const segmenter = new (Intl as any).Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (segment: any) => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === "characters") {
      const words = currentText.split(" ");
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }
    if (splitBy === "words") {
      return currentText.split(" ").map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    if (splitBy === "lines") {
      return currentText.split("\n").map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1,
      }));
    }

    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index: number, totalChars: number) => {
      const total = totalChars;
      if (staggerFrom === "first") return index * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
      if (staggerFrom === "center") {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === "random") {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs((staggerFrom as number) - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = useCallback(() => {
    const nextIndex =
      currentTextIndex === texts.length - 1
        ? loop
          ? 0
          : currentTextIndex
        : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex =
      currentTextIndex === 0
        ? loop
          ? texts.length - 1
          : currentTextIndex
        : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset,
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  const gradientStyle = colors
    ? {
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text" as const,
        WebkitTextFillColor: "transparent" as const,
        backgroundClip: "text" as const,
        animation: `gradient-shift ${animationSpeed}s linear infinite`,
      }
    : undefined;

  return (
    <motion.span
      className={cn(
        "flex flex-wrap",
        showBorder && colors && "px-4 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80",
        mainClassName
      )}
      layout="position"
    >
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.div
          key={currentTextIndex}
          className={cn("flex flex-wrap", splitLevelClassName)}
          layout
          style={gradientStyle}
        >
          {elements.map((word, wordIndex) => (
            <span key={wordIndex} className="flex">
              {word.characters.map((character: string, charIndex: number) => {
                const totalChars = elements.reduce(
                  (acc, word) => acc + word.characters.length,
                  0
                );
                const globalCharIndex =
                  elements
                    .slice(0, wordIndex)
                    .reduce((acc, word) => acc + word.characters.length, 0) + charIndex;

                return (
                  <motion.span
                    key={charIndex}
                    initial={initialProp}
                    animate={animateProp}
                    exit={exitProp}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(globalCharIndex, totalChars),
                    }}
                    className={cn("inline-block", elementLevelClassName)}
                  >
                    {character}
                  </motion.span>
                );
              })}
              {word.needsSpace && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = "RotatingText";
