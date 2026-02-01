/**
 * Shared utilities for browse API routes
 *
 * This module provides common functionality used by movie, TV, and anime
 * browse endpoints to reduce code duplication and ensure consistent behavior.
 *
 * @module browse-utils
 */

import { NextResponse } from 'next/server';
import { getIMDbId, filterBlockedContent } from '@/lib/tmdb';
import { getOMDbData } from '@/lib/omdb';
import { safeParseInt } from '@/lib/security';
import {
  BROWSE_CACHE_SECONDS,
  BROWSE_SWR_SECONDS,
  MIN_PAGE,
  MAX_PAGE,
  MIN_YEAR,
  MAX_YEAR,
  MAX_GENRE_ID,
  MAX_MIN_VOTES,
  DEFAULT_MIN_VOTES,
} from '@/lib/constants';
import type { Movie, TVShow, SearchResult } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Media type for browse operations.
 */
export type BrowseMediaType = 'movie' | 'tv';

/**
 * Parsed and validated query parameters for browse requests.
 */
export interface BrowseParams {
  /** Current page number (1-1000) */
  page: number;
  /** Genre ID filter */
  genre: number | undefined;
  /** Sort order (e.g., 'popularity.desc', 'vote_average.desc') */
  sortBy: string;
  /** Release year filter */
  year: number | undefined;
  /** Original language filter (ISO 639-1 code) */
  language: string | undefined;
  /** Minimum vote count filter */
  minVotes: number;
}

/**
 * Media item with optional IMDB rating data.
 */
export type MediaItemWithRating = (Movie | TVShow) & {
  imdbRating: string | null;
  imdbVotes: string | null;
};

// ============================================================================
// Query Parameter Parsing
// ============================================================================

/**
 * Parses and validates query parameters from a browse request URL.
 *
 * Handles:
 * - Page number with bounds checking (1-1000)
 * - Genre ID validation
 * - Sort order with sensible default
 * - Year validation (1900-2100)
 * - Language code passthrough
 * - Min votes with context-aware defaults
 *
 * @param searchParams - URL search parameters from request
 * @returns Validated browse parameters
 *
 * @example
 * const params = parseBrowseParams(new URL(request.url).searchParams);
 * const data = await discoverMoviesWithFilters(params);
 */
export function parseBrowseParams(searchParams: URLSearchParams): BrowseParams {
  const page = safeParseInt(searchParams.get('page'), 1, MIN_PAGE, MAX_PAGE);
  const genre = searchParams.get('genre')
    ? safeParseInt(searchParams.get('genre'), undefined, 1, MAX_GENRE_ID)
    : undefined;
  const sortBy = searchParams.get('sort_by') || 'popularity.desc';
  const year = searchParams.get('year')
    ? safeParseInt(searchParams.get('year'), undefined, MIN_YEAR, MAX_YEAR)
    : undefined;
  const language = searchParams.get('language') || undefined;

  // For highest rated sorting, use a minimum vote threshold to filter out
  // obscure content with inflated ratings (e.g., 10.0 with 2 votes)
  const isHighestRated = sortBy === 'vote_average.desc';
  const defaultMinVotes = isHighestRated ? DEFAULT_MIN_VOTES : 0;
  const minVotes = searchParams.get('min_votes')
    ? safeParseInt(searchParams.get('min_votes'), defaultMinVotes, 0, MAX_MIN_VOTES)
    : defaultMinVotes;

  return { page, genre, sortBy, year, language, minVotes };
}

// ============================================================================
// IMDB Rating Enrichment
// ============================================================================

/**
 * Enriches media items with IMDB ratings from OMDb.
 *
 * For each item:
 * 1. Fetches IMDB ID via TMDB external IDs
 * 2. Fetches rating data from OMDb
 * 3. Falls back to null ratings on any error
 *
 * Errors are silently handled per-item to ensure partial failures
 * don't break the entire response.
 *
 * @param items - Array of movies or TV shows to enrich
 * @param mediaType - Type of media ('movie' or 'tv')
 * @returns Promise resolving to items with imdbRating and imdbVotes fields
 *
 * @example
 * const enriched = await enrichWithImdbRatings(movies, 'movie');
 */
export async function enrichWithImdbRatings<T extends Movie | TVShow>(
  items: T[],
  mediaType: BrowseMediaType
): Promise<MediaItemWithRating[]> {
  return Promise.all(
    items.map(async (item): Promise<MediaItemWithRating> => {
      try {
        const imdbId = await getIMDbId(mediaType, item.id);
        if (imdbId) {
          const omdbData = await getOMDbData(imdbId);
          return {
            ...item,
            imdbRating: omdbData?.imdbRating || null,
            imdbVotes: omdbData?.imdbVotes || null,
          };
        }
      } catch {
        // Silently fall back to TMDB rating on any error
        // This ensures partial OMDb failures don't break the response
      }
      return { ...item, imdbRating: null, imdbVotes: null };
    })
  );
}

// ============================================================================
// Sorting Utilities
// ============================================================================

/**
 * Sorts media items by IMDB rating, falling back to TMDB vote_average.
 *
 * Used when sortBy is 'vote_average.desc' to provide more accurate
 * ratings than TMDB's often inflated scores.
 *
 * @param items - Array of items with imdbRating field
 * @returns Same array, sorted in place by rating (descending)
 *
 * @example
 * const sorted = sortByImdbRating(enrichedItems);
 */
export function sortByImdbRating(items: MediaItemWithRating[]): MediaItemWithRating[] {
  return items.sort((a, b) => {
    const ratingA = a.imdbRating
      ? parseFloat(a.imdbRating)
      : (a.vote_average ?? 0);
    const ratingB = b.imdbRating
      ? parseFloat(b.imdbRating)
      : (b.vote_average ?? 0);
    return ratingB - ratingA;
  });
}

// ============================================================================
// Response Creation
// ============================================================================

/**
 * Cache-Control header value for browse responses.
 * Uses stale-while-revalidate for optimal performance.
 */
const BROWSE_CACHE_HEADER = `public, s-maxage=${BROWSE_CACHE_SECONDS}, stale-while-revalidate=${BROWSE_SWR_SECONDS}`;

/**
 * Creates a JSON response with appropriate caching headers for browse data.
 *
 * @param data - Response data to serialize
 * @returns NextResponse with Cache-Control headers
 *
 * @example
 * return createBrowseResponse({ ...data, results: enrichedResults });
 */
export function createBrowseResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': BROWSE_CACHE_HEADER,
    },
  });
}

/**
 * Creates an error response for browse API failures.
 *
 * @param message - Error message for the response
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error payload
 *
 * @example
 * return createBrowseErrorResponse('Failed to fetch movies');
 */
export function createBrowseErrorResponse(
  message: string,
  status: number = 500
): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// Complete Browse Handler
// ============================================================================

/**
 * Options for the processBrowseRequest helper.
 */
export interface ProcessBrowseOptions {
  /** The incoming request object */
  request: Request;
  /** Media type being browsed */
  mediaType: BrowseMediaType;
  /** Function to fetch data from TMDB */
  fetchData: (params: BrowseParams) => Promise<SearchResult>;
  /** Error message prefix for logging and response */
  errorPrefix: string;
}

/**
 * Processes a complete browse request with IMDB enrichment.
 *
 * This is the main entry point for browse routes, handling:
 * 1. Query parameter parsing and validation
 * 2. TMDB data fetching via provided function
 * 3. Adult content filtering
 * 4. IMDB rating enrichment (if results exist)
 * 5. Re-sorting by IMDB rating (if sorting by vote_average)
 * 6. Response creation with caching headers
 * 7. Error handling with logging
 *
 * @param options - Configuration for the browse request
 * @returns NextResponse with browse results or error
 *
 * @example
 * export async function GET(request: Request) {
 *   return processBrowseRequest({
 *     request,
 *     mediaType: 'movie',
 *     fetchData: (params) => discoverMoviesWithFilters(params),
 *     errorPrefix: 'Browse movies',
 *   });
 * }
 */
export async function processBrowseRequest(
  options: ProcessBrowseOptions
): Promise<NextResponse> {
  const { request, mediaType, fetchData, errorPrefix } = options;

  try {
    const { searchParams } = new URL(request.url);
    const params = parseBrowseParams(searchParams);

    // Fetch data from TMDB
    const data = await fetchData(params);

    // Filter out blocked adult content
    const filteredResults = filterBlockedContent(data.results || []);

    // If no results, return early
    if (filteredResults.length === 0) {
      return createBrowseResponse(data);
    }

    // Enrich with IMDB ratings
    let enrichedResults = await enrichWithImdbRatings(filteredResults, mediaType);

    // Re-sort by IMDB rating if sorting by highest rated
    if (params.sortBy === 'vote_average.desc') {
      enrichedResults = sortByImdbRating(enrichedResults);
    }

    return createBrowseResponse({ ...data, results: enrichedResults });
  } catch (error) {
    console.error(`${errorPrefix} error:`, error);
    return createBrowseErrorResponse(`Failed to fetch ${mediaType === 'movie' ? 'movies' : 'TV shows'}`);
  }
}
