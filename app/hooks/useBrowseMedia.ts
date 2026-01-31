"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { BrowseOptions, BrowseResponse, MediaItem } from "@/types";
import {
  fetchBrowsePage,
  fetchRatingSortedResults,
  isRatingSort,
} from "@/lib/api/browse";
import { ITEMS_PER_PAGE } from "@/lib/constants/browse";

export interface UseBrowseMediaOptions extends BrowseOptions {
  /** Whether the query is enabled */
  enabled?: boolean;
}

export interface UseBrowseMediaResult {
  /** All media items across all pages */
  items: MediaItem[];
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether fetching next page */
  isFetchingNextPage: boolean;
  /** Whether there are more pages to load */
  hasNextPage: boolean;
  /** Error if any */
  error: Error | null;
  /** Fetch the next page */
  fetchNextPage: () => void;
  /** Refetch all data */
  refetch: () => void;
}

/**
 * Hook for fetching and paginating browse media with TanStack Query
 *
 * Handles two modes:
 * 1. Normal pagination - uses useInfiniteQuery for lazy loading
 * 2. Rating sort - fetches multiple pages upfront, sorts by IMDB, returns top 100
 *
 * @example
 * ```tsx
 * const { items, isLoading, hasNextPage, fetchNextPage } = useBrowseMedia({
 *   mediaType: "movie",
 *   genre: 28,
 *   sortBy: "popularity.desc",
 * });
 * ```
 */
export function useBrowseMedia(
  options: UseBrowseMediaOptions
): UseBrowseMediaResult {
  const { enabled = true, ...browseOptions } = options;
  const isRatingSortMode = isRatingSort(browseOptions.sortBy);

  // Query key includes all filter options to cache different combinations
  const queryKey = ["browse", browseOptions] as const;

  // For rating sort: fetch all pages upfront and sort client-side
  const ratingQuery = useQuery({
    queryKey: [...queryKey, "rating-sorted"],
    queryFn: () => fetchRatingSortedResults(browseOptions),
    enabled: enabled && isRatingSortMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // For normal pagination: use infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchBrowsePage(browseOptions, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage: BrowseResponse) => {
      // Check if there are more pages
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      // Fallback: check if we got a full page of results
      if (lastPage.results.length >= ITEMS_PER_PAGE) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: enabled && !isRatingSortMode,
    staleTime: 60 * 1000, // 1 minute
  });

  // Return unified interface regardless of mode
  if (isRatingSortMode) {
    return {
      items: ratingQuery.data || [],
      isLoading: ratingQuery.isLoading,
      isFetchingNextPage: false,
      hasNextPage: false, // Rating sort shows all results at once
      error: ratingQuery.error as Error | null,
      fetchNextPage: () => {}, // No-op for rating sort
      refetch: () => ratingQuery.refetch(),
    };
  }

  // Flatten all pages into a single array
  const items = infiniteQuery.data?.pages.flatMap((page) => page.results) || [];

  return {
    items,
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    error: infiniteQuery.error as Error | null,
    fetchNextPage: () => infiniteQuery.fetchNextPage(),
    refetch: () => infiniteQuery.refetch(),
  };
}
