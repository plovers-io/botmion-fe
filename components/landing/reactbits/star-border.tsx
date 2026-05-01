"use client";

import { ReactNode, ElementType } from "react";

interface StarBorderProps {
  as?: ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children: ReactNode;
  [key: string]: any;
}

export function StarBorder({
  as: Component = "button",
  className = "",
  color = "#10b981",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps) {
  const Tag = Component as any;

  return (
    <Tag
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ padding: `${thickness}px`, ...rest.style }}
      {...rest}
    >
      <style jsx>{`
        @keyframes rotate-bottom {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotate-top {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
      {/* Animated gradient borders */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`,
          animation: `rotate-bottom ${speed} linear infinite`,
        }}
      />
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`,
          animation: `rotate-top ${speed} linear infinite`,
          opacity: 0.4,
        }}
      />
      {/* Inner content */}
      <div className="relative z-10 w-full h-full bg-white rounded-xl">
        {children}
      </div>
    </Tag>
  );
}
