"use client";

import { memo } from "react";

interface PageErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Whether to show a "Go Back" button */
  showBackButton?: boolean;
  /** Custom back button handler (defaults to window.history.back) */
  onBack?: () => void;
  /** Retry handler - if provided, shows a retry button */
  onRetry?: () => void;
}

/**
 * Full-page error state with optional back and retry buttons
 * Replaces duplicated error UI across pages
 *
 * @example
 * ```tsx
 * if (error) {
 *   return (
 *     <PageErrorState
 *       message="Failed to load content"
 *       showBackButton
 *       onRetry={() => refetch()}
 *     />
 *   );
 * }
 * ```
 */
export const PageErrorState = memo(function PageErrorState({
  message = "Something went wrong. Please try again.",
  showBackButton = true,
  onBack,
  onRetry,
}: PageErrorStateProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <p className="text-white text-lg mb-6">{message}</p>
        <div className="flex items-center justify-center gap-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              aria-label="Go back to previous page"
            >
              Go Back
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              aria-label="Retry loading content"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
