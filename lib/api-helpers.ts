import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { type User } from "@/lib/db";
import { getIMDbId } from "@/lib/tmdb";
import { getOMDbData } from "@/lib/omdb";

// Re-export User type for convenience
export type { User };

// ============================================================================
// Types
// ============================================================================

export type MediaType = "movie" | "tv";

export interface AuthResult {
  user: User;
}

export interface IMDBData {
  imdbRating: string | null;
  imdbVotes: string | null;
  metascore?: string | null;
  rottenTomatoes?: string | null;
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Require authentication for an API route
 * Returns the user if authenticated, or a 401 response
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await requireAuth();
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return { user };
}

/**
 * Check if auth result is an error response
 */
export function isAuthError(
  result: AuthResult | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate media type is either 'movie' or 'tv'
 */
export function validateMediaType(type: string | null): type is MediaType {
  return type === "movie" || type === "tv";
}

/**
 * Validate and return media type, or return error response
 */
export function requireValidMediaType(
  type: string | null
): MediaType | NextResponse {
  if (!validateMediaType(type)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }
  return type;
}

/**
 * Check if validation result is an error response
 */
export function isValidationError(
  result: MediaType | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

// ============================================================================
// Cache Headers
// ============================================================================

/**
 * Standard cache durations (in seconds)
 */
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

/**
 * Add cache headers to a response
 *
 * @example
 * ```typescript
 * return withCacheHeaders(
 *   NextResponse.json(data),
 *   CACHE_DURATIONS.MEDIUM
 * );
 * ```
 */
export function withCacheHeaders(
  response: NextResponse,
  seconds: number,
  staleWhileRevalidate?: number
): NextResponse {
  const swr = staleWhileRevalidate ?? seconds * 2;
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`
  );
  return response;
}

/**
 * Create a JSON response with cache headers
 */
export function jsonWithCache<T>(
  data: T,
  seconds: number,
  staleWhileRevalidate?: number
): NextResponse {
  return withCacheHeaders(NextResponse.json(data), seconds, staleWhileRevalidate);
}

// ============================================================================
// IMDB Rating Enrichment
// ============================================================================

/**
 * Enrich a media item with IMDB ratings
 * Uses cached OMDB data (24h cache in omdb.ts)
 *
 * @example
 * ```typescript
 * const movieWithRating = await enrichWithIMDBRating(movie, 'movie', movie.id);
 * ```
 */
export async function enrichWithIMDBRating<T extends Record<string, unknown>>(
  item: T,
  type: MediaType,
  id: number
): Promise<T & IMDBData> {
  try {
    const imdbId = await getIMDbId(type, id);
    if (imdbId) {
      const omdbData = await getOMDbData(imdbId);
      if (omdbData) {
        return {
          ...item,
          imdbRating: omdbData.imdbRating || null,
          imdbVotes: omdbData.imdbVotes || null,
          metascore: omdbData.metascore || null,
          rottenTomatoes: omdbData.rottenTomatoes || null,
        };
      }
    }
  } catch {
    // Ignore errors, fall back to no IMDB data
  }

  return {
    ...item,
    imdbRating: null,
    imdbVotes: null,
  };
}

/**
 * Enrich multiple items with IMDB ratings in parallel
 */
export async function enrichManyWithIMDBRating<
  T extends Record<string, unknown> & { id: number }
>(items: T[], type: MediaType): Promise<(T & IMDBData)[]> {
  return Promise.all(items.map((item) => enrichWithIMDBRating(item, type, item.id)));
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Standard error response
 */
export function errorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Log error and return standard error response
 */
export function handleError(
  error: unknown,
  context: string,
  message: string = "An error occurred"
): NextResponse {
  console.error(`${context}:`, error);
  return errorResponse(message, 500);
}

// ============================================================================
// Input Validation Helpers
// ============================================================================

/**
 * Valid sort options for movies
 */
export const VALID_MOVIE_SORTS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "release_date.desc",
  "release_date.asc",
  "revenue.desc",
  "revenue.asc",
] as const;

/**
 * Valid sort options for TV shows
 */
export const VALID_TV_SORTS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "first_air_date.desc",
  "first_air_date.asc",
] as const;

/**
 * Validate sort option
 */
export function isValidSort(
  sort: string | null,
  validSorts: readonly string[]
): boolean {
  return sort !== null && validSorts.includes(sort);
}

/**
 * Get validated sort or default
 */
export function getValidatedSort(
  sort: string | null,
  validSorts: readonly string[],
  defaultSort: string = "popularity.desc"
): string {
  if (sort && validSorts.includes(sort)) {
    return sort;
  }
  return defaultSort;
}
