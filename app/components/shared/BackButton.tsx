"use client";

import { memo } from "react";

interface BackButtonProps {
  /** Custom click handler (defaults to window.history.back) */
  onClick?: () => void;
  /** Button label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable back navigation button
 * Replaces duplicated back button UI across pages
 *
 * @example
 * ```tsx
 * <BackButton />
 * <BackButton label="Back to Home" onClick={() => router.push('/')} />
 * ```
 */
export const BackButton = memo(function BackButton({
  onClick,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${className}`}
      aria-label="Go back to previous page"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
});
