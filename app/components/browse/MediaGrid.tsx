"use client";

import { memo } from "react";
import MovieCard from "@/app/components/MovieCard";
import type { MediaItem, MediaType } from "@/types";

interface MediaGridProps {
  /** Array of media items to display */
  items: MediaItem[];
  /** Media type for all items, or determine from each item */
  mediaType: MediaType | "auto";
}

/**
 * Responsive grid for displaying media cards
 *
 * @example
 * ```tsx
 * <MediaGrid items={movies} mediaType="movie" />
 * <MediaGrid items={searchResults} mediaType="auto" />
 * ```
 */
export const MediaGrid = memo(function MediaGrid({
  items,
  mediaType,
}: MediaGridProps) {
  // Determine media type for each item
  const getItemMediaType = (item: MediaItem): MediaType => {
    if (mediaType !== "auto") return mediaType;
    // Auto-detect from item's media_type or check for title vs name
    if (item.media_type) return item.media_type as MediaType;
    return "title" in item ? "movie" : "tv";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <MovieCard
          key={item.id}
          item={item}
          mediaType={getItemMediaType(item)}
        />
      ))}
    </div>
  );
});
