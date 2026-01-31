/**
 * Application-wide constants
 * Centralized configuration for magic numbers and default values
 */

// ============================================================================
// Watch Progress & Duration
// ============================================================================

/** Default duration for movies in seconds (2 hours) */
export const MOVIE_DURATION_SECONDS = 7200;

/** Default duration for TV episodes in seconds (40 minutes) */
export const TV_EPISODE_DURATION_SECONDS = 2400;

/** Progress in seconds to mark as "started watching" (2 minutes) */
export const WATCH_STARTED_PROGRESS = 120;

/** Threshold to consider content "watched" (90% complete) */
export const WATCHED_THRESHOLD_PERCENT = 0.9;

// ============================================================================
// React Query / Caching
// ============================================================================

/** Stale time for media queries (5 minutes in ms) */
export const MEDIA_STALE_TIME = 5 * 60 * 1000;

/** Cache duration for trending content (15 minutes in seconds) */
export const TRENDING_CACHE_DURATION = 900;

// ============================================================================
// API / Rate Limiting
// ============================================================================

/** Default rate limit window (15 minutes in ms) */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Default max requests per window */
export const RATE_LIMIT_MAX_REQUESTS = 5;

/** Login rate limit per IP (10 attempts per 15 min) */
export const LOGIN_RATE_LIMIT_IP = 10;

/** Login rate limit per username (10 attempts per hour) */
export const LOGIN_RATE_LIMIT_USER = 10;

// ============================================================================
// Browse / Discovery
// ============================================================================

/** Minimum votes for regular movies (filters out low-rated niche content) */
export const MIN_VOTES_MOVIE = 500;

/** Minimum votes for anime movies */
export const MIN_VOTES_ANIME_MOVIE = 50;

/** Minimum votes for regular TV shows */
export const MIN_VOTES_TV = 250;

/** Minimum votes for anime TV shows */
export const MIN_VOTES_ANIME_TV = 50;

/** Default minimum votes for browse */
export const DEFAULT_MIN_VOTES = 10;

/** Animation genre ID in TMDB */
export const ANIMATION_GENRE_ID = 16;

/** Japanese language code */
export const JAPANESE_LANGUAGE = "ja";

// ============================================================================
// UI / Pagination
// ============================================================================

/** Default items per page for grids */
export const ITEMS_PER_PAGE = 20;

/** Max history items to show in Continue Watching */
export const MAX_CONTINUE_WATCHING = 20;

/** Max watchlist items to fetch */
export const MAX_WATCHLIST_ITEMS = 100;

/** Number of cast members to show */
export const MAX_CAST_DISPLAY = 5;

/** Number of genres to show in metadata */
export const MAX_GENRES_DISPLAY = 4;

// ============================================================================
// Video Sources
// ============================================================================

/** Number of video sources available */
export const VIDEO_SOURCE_COUNT = 10;

/** Default video source key */
export const DEFAULT_VIDEO_SOURCE = "vidsrc";

// ============================================================================
// Validation
// ============================================================================

/** Minimum username length */
export const USERNAME_MIN_LENGTH = 3;

/** Maximum username length */
export const USERNAME_MAX_LENGTH = 20;

/** Minimum password length */
export const PASSWORD_MIN_LENGTH = 4;

/** Maximum password length */
export const PASSWORD_MAX_LENGTH = 100;

/** Maximum search query length */
export const MAX_SEARCH_QUERY_LENGTH = 200;

/** Maximum display name length */
export const MAX_DISPLAY_NAME_LENGTH = 50;
