"use client";

import { CheckCircle2, Circle } from "lucide-react";
import {
  getPasswordRequirementState,
  getPasswordScore,
  PASSWORD_REQUIREMENTS,
} from "@/lib/utils/password";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

function getStrengthLabel(score: number) {
  if (score <= 1) return { label: "Weak", color: "text-rose-600" };
  if (score <= 3) return { label: "Medium", color: "text-amber-600" };
  return { label: "Strong", color: "text-emerald-600" };
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const requirements = getPasswordRequirementState(password);
  const score = getPasswordScore(password);
  const total = PASSWORD_REQUIREMENTS.length;
  const percent = Math.round((score / total) * 100);
  const strength = getStrengthLabel(score);

  return (
    <div
      className={`rounded-xl border border-emerald-200/60 bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">Password strength</p>
        <p className={`text-xs font-semibold ${strength.color}`}>
          {strength.label} ({score}/{total})
        </p>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <div
          className="h-2 rounded-full bg-linear-to-r from-emerald-500 to-teal-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 space-y-1 text-xs text-emerald-700 dark:text-emerald-200">
        {requirements.map((requirement) => (
          <div key={requirement.id} className="flex items-center gap-2">
            {requirement.satisfied ? (
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-300" />
            ) : (
              <Circle size={14} className="text-emerald-300 dark:text-emerald-500/60" />
            )}
            <span
              className={
                requirement.satisfied
                  ? "font-medium text-emerald-700 dark:text-emerald-100"
                  : "text-emerald-500 dark:text-emerald-300"
              }
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
