"use client";

import React from "react";
import { Loader2 } from "lucide-react";
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

/**
 * ConfirmDialog — drop-in replacement for the old ConfirmModal.
 * Built on top of shadcn AlertDialog (Radix UI) for accessibility & consistency.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="items-center text-center">
          {icon && (
            <div
              className={cn(
                "inline-flex items-center justify-center w-14 h-14 rounded-full mb-2",
                confirmVariant === "danger"
                  ? "bg-red-50 border border-red-100"
                  : "bg-emerald-50 border border-emerald-100"
              )}
            >
              {icon}
            </div>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
          <AlertDialogCancel
            disabled={isLoading}
            className="flex-1 mt-0"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent auto-close; we control it via isLoading
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "flex-1",
              confirmVariant === "danger" &&
                buttonVariants({ variant: "destructive" })
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin size-4" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Re-export with the old name for backward compatibility
export { ConfirmDialog as ConfirmModal };
