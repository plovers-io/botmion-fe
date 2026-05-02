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
  as: Component = "div",
  className = "",
  color = "#d946ef",
  speed = "5s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps) {
  const Tag = Component as any;

  return (
    <Tag
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ padding: thickness, ...rest.style }}
      {...rest}
    >
      {/* Oversized rotating gradient — only edges visible through wrapper */}
      <span
        className="absolute z-0 block"
        style={{
          top: "-100%",
          left: "-100%",
          width: "300%",
          height: "300%",
          background: `conic-gradient(from 0deg, transparent, ${color}, transparent 15%)`,
          animation: `border-spin ${speed} linear infinite`,
        }}
      />
      {/* Content covers center, only padding gap shows gradient */}
      <span className="relative z-[1] flex items-center justify-center w-full h-full rounded-xl overflow-hidden">
        {children}
      </span>

      <style jsx>{`
        @keyframes border-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Tag>
  );
}
