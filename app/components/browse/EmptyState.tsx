"use client";

import { memo } from "react";

interface EmptyStateProps {
  /** Type of empty state to show */
  type: "search" | "filter";
  /** Label for the media type (e.g., "movies", "TV shows", "anime") */
  mediaLabel?: string;
  /** Optional custom message override */
  message?: string;
  /** Optional custom suggestion override */
  suggestion?: string;
}

/**
 * Reusable empty state component for browse pages
 *
 * @example
 * ```tsx
 * <EmptyState type="search" mediaLabel="movies" />
 * <EmptyState type="filter" mediaLabel="TV shows" />
 * ```
 */
export const EmptyState = memo(function EmptyState({
  type,
  mediaLabel = "items",
  message,
  suggestion,
}: EmptyStateProps) {
  const defaultMessages = {
    search: {
      message: `No ${mediaLabel} found for your search.`,
      suggestion: "Try a different search term.",
    },
    filter: {
      message: `No ${mediaLabel} found with these filters.`,
      suggestion: "Try selecting a different country or genre.",
    },
  };

  const displayMessage = message || defaultMessages[type].message;
  const displaySuggestion = suggestion || defaultMessages[type].suggestion;

  return (
    <div className="text-center py-20 text-gray-400">
      <p className="mb-4">{displayMessage}</p>
      <p className="text-sm">{displaySuggestion}</p>
    </div>
  );
});
