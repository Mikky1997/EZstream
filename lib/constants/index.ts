/**
 * Centralized constants for the EZstream application
 *
 * Import from this file for all app-wide constants:
 * @example
 * import { SESSION_DURATION_DAYS, BROWSE_CACHE_SECONDS } from '@/lib/constants';
 */

// Export everything from app.ts (primary source)
export * from './app';

// Export browse-specific constants (excluding re-exports to avoid conflicts)
export {
  MOVIE_GENRES,
  TV_GENRES,
  MOVIE_SORT_OPTIONS,
  TV_SORT_OPTIONS,
  ANIME_CATEGORIES,
  ANIME_TYPE_OPTIONS,
  ANIME_SORT_OPTIONS,
  ANIME_GENRES,
  COUNTRY_OPTIONS,
  generateYearOptions,
  MOVIE_YEAR_OPTIONS,
  TV_YEAR_OPTIONS,
  DEFAULT_SORT,
  RATING_SORT,
  RATING_SORT_PAGES_TO_FETCH,
  RATING_SORT_TOP_N,
} from './browse';
