"use client";

import { memo } from "react";

interface LoadingSpinnerProps {
  /** Size of the spinner: "sm" for inline, "lg" for full page */
  size?: "sm" | "lg";
  /** Optional custom class names */
  className?: string;
}

/**
 * Reusable loading spinner component
 *
 * @example
 * ```tsx
 * // Full page loading
 * <LoadingSpinner size="lg" />
 *
 * // Inline load more indicator
 * <LoadingSpinner size="sm" />
 * ```
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  size = "lg",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = size === "lg" ? "h-12 w-12 border-b-2" : "h-8 w-8 border-2";

  const spinner = (
    <div
      className={`animate-spin rounded-full border-white ${
        size === "sm" ? "border-t-transparent" : ""
      } ${sizeClasses} ${className}`}
    />
  );

  // Full page centered spinner
  if (size === "lg") {
    return (
      <div className="flex items-center justify-center py-20">{spinner}</div>
    );
  }

  // Inline spinner
  return <div className="inline-block">{spinner}</div>;
});
