"use client";

import React from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  maxWidth?: "sm" | "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
  maxWidth = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthStyles[maxWidth]} w-full mx-4 animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer -mt-1 -mr-1"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-3">
          {description && (
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export interface ConfirmModalProps {
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

export function ConfirmModal({
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
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const confirmButtonStyles = {
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-200",
    primary:
      "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm shadow-violet-200",
  };

  const iconBgStyles = {
    danger: "bg-red-50 border border-red-100",
    primary: "bg-violet-50 border border-violet-100",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Close button */}
        {!isLoading && (
          <div className="flex justify-end p-4 pb-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-6 pt-2 text-center">
          {/* Icon */}
          {icon && (
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${iconBgStyles[confirmVariant]} mb-4`}>
              {icon}
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{description}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-gray-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${confirmButtonStyles[confirmVariant]}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
