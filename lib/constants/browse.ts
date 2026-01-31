// Browse page constants - centralized configuration for all browse pages

// ============================================================================
// Genre Options
// ============================================================================

export const MOVIE_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
] as const;

export const TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
] as const;

// ============================================================================
// Sort Options
// ============================================================================

export const MOVIE_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" },
  { value: "revenue.desc", label: "Highest Grossing" },
] as const;

export const TV_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "first_air_date.desc", label: "Newest" },
  { value: "first_air_date.asc", label: "Oldest" },
] as const;

export const ANIME_CATEGORIES = [
  { id: "popular", name: "Popular", sortBy: "popularity.desc" },
  { id: "top_rated", name: "Top Rated", sortBy: "vote_average.desc" },
  { id: "new", name: "New Releases", sortBy: "first_air_date.desc" },
] as const;

// Anime type options (Series vs Movies)
export const ANIME_TYPE_OPTIONS = [
  { value: "tv", label: "Anime Series" },
  { value: "movie", label: "Anime Movies" },
] as const;

// Anime-specific sort options (same as TV but works for both)
export const ANIME_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "first_air_date.desc", label: "Newest" },
  { value: "first_air_date.asc", label: "Oldest" },
] as const;

// Anime genres (subset relevant to anime)
export const ANIME_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
] as const;

// ============================================================================
// Country/Language Options
// ============================================================================

interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: "", label: "All Countries", flag: "" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "tr", label: "Turkish", flag: "🇹🇷" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "hi", label: "Hindi", flag: "🇮🇳" },
  { value: "zh", label: "Chinese", flag: "🇨🇳" },
  { value: "th", label: "Thai", flag: "🇹🇭" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "it", label: "Italian", flag: "🇮🇹" },
];

// ============================================================================
// Year Options Generator
// ============================================================================

/**
 * Generate year options from current year down to a start year
 * @param startYear - The earliest year to include (default: 1900 for movies, 1950 for TV)
 */
export function generateYearOptions(startYear: number = 1900) {
  const currentYear = new Date().getFullYear();
  return [
    { value: "", label: "All Years" },
    ...Array.from({ length: currentYear - startYear + 1 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];
}

// Pre-generated year options for common use cases
export const MOVIE_YEAR_OPTIONS = generateYearOptions(1900);
export const TV_YEAR_OPTIONS = generateYearOptions(1950);

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_SORT = "popularity.desc";
export const RATING_SORT = "vote_average.desc";
export const ANIMATION_GENRE_ID = 16;
export const JAPANESE_LANGUAGE = "ja";

// ============================================================================
// Pagination
// ============================================================================

export const ITEMS_PER_PAGE = 20;
export const RATING_SORT_PAGES_TO_FETCH = 5; // Fetch 5 pages for rating sort
export const RATING_SORT_TOP_N = 100; // Show top 100 results for rating sort
