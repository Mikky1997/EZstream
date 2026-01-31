"use client";

import { memo } from "react";

interface PageLoadingStateProps {
  /** Loading message to display */
  message?: string;
}

/**
 * Full-page loading state with centered spinner
 * Replaces duplicated loading UI across pages
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <PageLoadingState message="Loading movie details..." />;
 * }
 * ```
 */
export const PageLoadingState = memo(function PageLoadingState({
  message = "Loading...",
}: PageLoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        <p className="mt-4 text-gray-400 text-lg">{message}</p>
      </div>
    </div>
  );
});
