"use client";

import React from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant = "primary",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const isDanger = confirmVariant === "danger";
  const resolvedIcon = isDanger
    ? <Trash2 aria-hidden className="size-6 stroke-[2.6] text-white" />
    : (icon ?? null);
  const resolvedConfirmText = confirmText ?? (isDanger ? "Yes" : "Confirm");
  const resolvedCancelText = cancelText ?? (isDanger ? "No" : "Cancel");

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent
        size="md"
        className={cn(
          "max-w-110 overflow-hidden rounded-2xl border border-slate-200 p-0",
          "bg-white shadow-[0_22px_42px_-14px_rgba(15,23,42,0.35)]",
          "dark:border-white/10 dark:bg-[#1c1c1e] dark:shadow-[0_24px_44px_-16px_rgba(0,0,0,0.62)]",
        )}
      >
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 z-10 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <X className="size-5" />
        </button>

        {resolvedIcon && (
          <div className="relative flex justify-center px-8 pt-8 pb-1">
            <span
              aria-hidden
              className={cn(
                "absolute top-6 h-16 w-16 rounded-full blur-xl opacity-30",
                isDanger ? "bg-red-400/90" : "bg-sky-400/90",
              )}
            />
            <span
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-full",
                isDanger
                  ? "bg-red-500 text-white ring-4 ring-red-100"
                  : "bg-sky-500 text-white",
              )}
            >
              <span className="text-white [&>svg]:size-6 [&>svg]:text-white">
                {resolvedIcon}
              </span>
            </span>
          </div>
        )}

        <AlertDialogHeader className="items-center px-8 pt-4 pb-0 text-center">
          <AlertDialogTitle
            className={cn(
              "font-semibold leading-tight text-slate-900 dark:text-slate-50",
              isDanger ? "text-[38px]" : "text-[22px]",
            )}
          >
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="mt-2 max-w-[320px] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="grid grid-cols-2 gap-3 px-8 pt-5 pb-8 sm:grid-cols-2 sm:justify-stretch">
          <AlertDialogCancel
            disabled={isLoading}
            className={cn(
              "mt-0 h-11 w-full cursor-pointer rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-colors",
              "hover:bg-slate-100",
              "dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {resolvedCancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "h-11 w-full cursor-pointer rounded-md text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1c1c1e]",
              isDanger
                ? "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 disabled:bg-red-500/70"
                : cn(buttonVariants({ variant: "default" }), "focus-visible:ring-primary"),
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </span>
            ) : (
              resolvedConfirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Re-export with the old name for backward compatibility
export { ConfirmDialog as ConfirmModal };
