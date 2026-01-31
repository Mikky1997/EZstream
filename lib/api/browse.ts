import type { BrowseOptions, BrowseResponse, MediaItem } from "@/types";
import {
  RATING_SORT,
  RATING_SORT_PAGES_TO_FETCH,
  RATING_SORT_TOP_N,
} from "@/lib/constants/browse";

/**
 * Build URL search params for browse API
 */
export function buildBrowseParams(
  options: BrowseOptions,
  page: number
): URLSearchParams {
  const params = new URLSearchParams({
    page: page.toString(),
    sort_by: options.sortBy || "popularity.desc",
  });

  if (options.genre) {
    params.append("genre", options.genre.toString());
  }

  if (options.language) {
    params.append("language", options.language);
  }

  if (options.year) {
    params.append("year", options.year);
  }

  return params;
}

/**
 * Fetch a single page of browse results
 */
export async function fetchBrowsePage(
  options: BrowseOptions,
  page: number
): Promise<BrowseResponse> {
  const params = buildBrowseParams(options, page);
  // Map mediaType to API route (movie -> movies, tv -> tv)
  const apiRoute = options.mediaType === "movie" ? "movies" : options.mediaType;
  const response = await fetch(`/api/browse/${apiRoute}?${params}`);

  if (!response.ok) {
    throw new Error(`Browse API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get effective rating (IMDB preferred, fallback to TMDB)
 */
export function getEffectiveRating(item: MediaItem): number {
  if (item.imdbRating && item.imdbRating !== "N/A") {
    return parseFloat(item.imdbRating);
  }
  return item.vote_average || 0;
}

/**
 * Fetch multiple pages for rating sort, deduplicate, and return top N
 * Used when sorting by rating to get more accurate IMDB-based rankings
 */
export async function fetchRatingSortedResults(
  options: BrowseOptions,
  pagesToFetch: number = RATING_SORT_PAGES_TO_FETCH,
  topN: number = RATING_SORT_TOP_N
): Promise<MediaItem[]> {
  const fetchPromises = Array.from({ length: pagesToFetch }, (_, i) =>
    fetchBrowsePage({ ...options, sortBy: RATING_SORT }, i + 1)
  );

  const results = await Promise.all(fetchPromises);
  const allItems = results.flatMap((data) => data.results || []);

  // Remove duplicates by ID
  const uniqueItems = Array.from(
    new Map(allItems.map((item) => [item.id, item])).values()
  );

  // Sort by IMDB rating and take top N
  uniqueItems.sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a));

  return uniqueItems.slice(0, topN);
}

/**
 * Check if the current sort is rating-based
 */
export function isRatingSort(sortBy: string | undefined): boolean {
  return sortBy === RATING_SORT;
}
