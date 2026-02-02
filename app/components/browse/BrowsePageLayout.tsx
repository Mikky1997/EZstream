'use client';

import { useState, useCallback, useMemo, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import SearchBar from '@/app/components/SearchBar';
import { useBrowseMedia } from '@/app/hooks/useBrowseMedia';
import { useInfiniteScroll } from '@/app/hooks/useInfiniteScroll';
import {
  FilterDropdown,
  MediaGrid,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from '@/app/components/browse';
import {
  COUNTRY_OPTIONS,
  DEFAULT_SORT,
  ANIME_TYPE_OPTIONS,
  ANIMATION_GENRE_ID,
  JAPANESE_LANGUAGE,
  ITEMS_PER_PAGE,
} from '@/lib/constants/browse';
import type { MediaType, MediaItem, GenreOption, SortOption } from '@/types';

// Pre-computed country dropdown options (constant, computed once)
const COUNTRY_DROPDOWN_OPTIONS = COUNTRY_OPTIONS.map(c => ({
  value: c.value,
  label: c.flag ? `${c.flag} ${c.label}` : c.label,
}));

// Pre-computed anime type dropdown options
const ANIME_TYPE_DROPDOWN_OPTIONS = ANIME_TYPE_OPTIONS.map(t => ({
  value: t.value,
  label: t.label,
}));

interface BrowsePageLayoutProps {
  /** Media type for this page (ignored in anime mode) */
  mediaType: MediaType;
  /** Available genres for this media type */
  genres: readonly GenreOption[];
  /** Available sort options */
  sortOptions: readonly SortOption[];
  /** Year options for the filter */
  yearOptions: readonly { value: string; label: string }[];
  /** Search bar placeholder */
  searchPlaceholder?: string;
  /** Filter type for search */
  searchFilterType?: 'movie' | 'tv' | 'anime' | 'all';
  /** Label for media items (e.g., "movies", "TV shows") */
  mediaLabel?: string;
  /** Whether to show country/language filter */
  showCountryFilter?: boolean;
  /** Whether this is the anime page (changes behavior) */
  animeMode?: boolean;
}

/**
 * Composed browse page layout that handles all common browse page functionality
 *
 * @example
 * ```tsx
 * <BrowsePageLayout
 *   mediaType="movie"
 *   genres={MOVIE_GENRES}
 *   sortOptions={MOVIE_SORT_OPTIONS}
 *   yearOptions={MOVIE_YEAR_OPTIONS}
 *   searchPlaceholder="Search movies..."
 *   mediaLabel="movies"
 * />
 * ```
 */
// Inner component that uses search params
function BrowsePageLayoutInner({
  mediaType,
  genres,
  sortOptions,
  yearOptions,
  searchPlaceholder = 'Search...',
  searchFilterType = 'all',
  mediaLabel = 'items',
  showCountryFilter = true,
  animeMode = false,
}: BrowsePageLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filter state from URL params
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? DEFAULT_SORT);
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('country') ?? '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') ?? '');
  // Anime type state (tv or movie)
  const [animeType, setAnimeType] = useState<'tv' | 'movie'>(
    (searchParams.get('animeType') as 'tv' | 'movie') ?? 'tv'
  );

  // Update URL when filters change
  const updateURL = useCallback(
    (
      genre: string,
      sort: string,
      country: string,
      year: string,
      animeTypeValue?: 'tv' | 'movie'
    ) => {
      const params = new URLSearchParams();
      if (genre) params.set('genre', genre);
      if (sort && sort !== DEFAULT_SORT) params.set('sort', sort);
      if (country) params.set('country', country);
      if (year) params.set('year', year);
      if (animeMode && animeTypeValue) params.set('animeType', animeTypeValue);

      const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newURL, { scroll: false });
    },
    [pathname, router, animeMode]
  );

  // Wrapper functions to update both state and URL
  const handleGenreChange = useCallback(
    (value: string) => {
      setSelectedGenre(value);
      updateURL(value, sortBy, selectedLanguage, selectedYear, animeType);
    },
    [sortBy, selectedLanguage, selectedYear, animeType, updateURL]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      setSortBy(value);
      updateURL(selectedGenre, value, selectedLanguage, selectedYear, animeType);
    },
    [selectedGenre, selectedLanguage, selectedYear, animeType, updateURL]
  );

  const handleLanguageChange = useCallback(
    (value: string) => {
      setSelectedLanguage(value);
      updateURL(selectedGenre, sortBy, value, selectedYear, animeType);
    },
    [selectedGenre, sortBy, selectedYear, animeType, updateURL]
  );

  const handleYearChange = useCallback(
    (value: string) => {
      setSelectedYear(value);
      updateURL(selectedGenre, sortBy, selectedLanguage, value, animeType);
    },
    [selectedGenre, sortBy, selectedLanguage, animeType, updateURL]
  );

  const handleAnimeTypeChange = useCallback(
    (value: string) => {
      const typeValue = value as 'tv' | 'movie';
      setAnimeType(typeValue);
      updateURL(selectedGenre, sortBy, selectedLanguage, selectedYear, typeValue);
    },
    [selectedGenre, sortBy, selectedLanguage, selectedYear, updateURL]
  );

  // Search state
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Convert genre options to dropdown format
  const genreDropdownOptions = useMemo(
    () => [
      { value: '', label: 'All Genres' },
      ...genres.map(g => ({ value: String(g.id), label: g.name })),
    ],
    [genres]
  );

  // Determine actual media type and fixed filters for anime mode
  const actualMediaType = animeMode ? animeType : mediaType;

  // Fetch data using TanStack Query
  const { items, isLoading, isFetchingNextPage, hasNextPage, error, fetchNextPage, refetch } =
    useBrowseMedia({
      mediaType: actualMediaType,
      // In anime mode: use Animation genre if no genre selected, otherwise use selected genre
      // (Japanese language filter ensures anime content)
      genre: animeMode
        ? selectedGenre
          ? parseInt(selectedGenre, 10)
          : ANIMATION_GENRE_ID
        : selectedGenre
        ? parseInt(selectedGenre, 10)
        : null,
      // In anime mode: always Japanese; otherwise use selected language
      language: animeMode ? JAPANESE_LANGUAGE : selectedLanguage,
      year: selectedYear,
      sortBy,
      enabled: !isSearching,
    });

  // Infinite scroll: preload when ~800px from bottom so next page is ready before user reaches it
  const loadMoreRef = useInfiniteScroll(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage && !isLoading && !isSearching,
    threshold: 0,
    rootMargin: '0px 0px 800px 0px',
  });

  // When first page returns fewer than a full page (e.g. after filtering), load next page once to fill the row
  const hasFetchedExtraRef = useRef(false);
  if (items.length === 0) hasFetchedExtraRef.current = false;
  useEffect(() => {
    if (
      isSearching ||
      isLoading ||
      isFetchingNextPage ||
      !hasNextPage ||
      hasFetchedExtraRef.current ||
      items.length === 0 ||
      items.length >= ITEMS_PER_PAGE
    )
      return;
    hasFetchedExtraRef.current = true;
    fetchNextPage();
  }, [isSearching, isLoading, isFetchingNextPage, hasNextPage, items.length, fetchNextPage]);

  // Search handlers
  const handleLiveResults = useCallback((results: unknown[]) => {
    setSearchResults(results as MediaItem[]);
    setIsSearching(results.length > 0);
  }, []);

  // Show search results or browse results
  const displayItems = isSearching ? searchResults : items;

  // Get selected country info for status text
  const selectedCountry = COUNTRY_OPTIONS.find(o => o.value === selectedLanguage);

  // Get selected genre name for status text
  const selectedGenreName = selectedGenre
    ? genres.find(g => g.id === parseInt(selectedGenre, 10))?.name
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar
            onSearch={() => {}}
            onLiveResults={handleLiveResults}
            placeholder={searchPlaceholder}
            filterType={searchFilterType}
          />
        </div>

        {/* Filters - hide when searching */}
        {!isSearching && (
          <div className="mb-6 flex flex-wrap items-center gap-3 md:gap-4">
            {/* Anime Type Filter (replaces Country for anime mode) */}
            {animeMode && (
              <FilterDropdown
                options={ANIME_TYPE_DROPDOWN_OPTIONS}
                value={animeType}
                onChange={handleAnimeTypeChange}
              />
            )}

            {/* Country/Language Filter (not shown in anime mode) */}
            {!animeMode && showCountryFilter && (
              <FilterDropdown
                options={COUNTRY_DROPDOWN_OPTIONS}
                value={selectedLanguage}
                onChange={handleLanguageChange}
              />
            )}

            {/* Genre Filter */}
            <FilterDropdown
              options={genreDropdownOptions}
              value={selectedGenre}
              onChange={handleGenreChange}
            />

            {/* Year Filter */}
            <FilterDropdown
              options={yearOptions}
              value={selectedYear}
              onChange={handleYearChange}
            />

            {/* Sort Filter */}
            <FilterDropdown options={sortOptions} value={sortBy} onChange={handleSortChange} />
          </div>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found <span className="text-accent">{searchResults.length}</span> results
            </span>
          ) : animeMode ? (
            <>
              Showing:{' '}
              <span className="text-accent">
                {animeType === 'tv' ? 'Anime Series' : 'Anime Movies'}
              </span>
              {selectedGenreName && (
                <span>
                  {' '}
                  in <span className="text-accent">{selectedGenreName}</span>
                </span>
              )}
            </>
          ) : (
            <>
              Showing:{' '}
              <span className="text-accent">
                {selectedCountry?.flag} {selectedCountry?.label}
              </span>{' '}
              {mediaLabel}
              {selectedGenreName && (
                <span>
                  {' '}
                  in <span className="text-accent">{selectedGenreName}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Error State */}
        {error && <ErrorState message={`Failed to load ${mediaLabel}`} onRetry={() => refetch()} />}

        {/* Loading State */}
        {isLoading && displayItems.length === 0 && !error && <LoadingSpinner size="lg" />}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {displayItems.length > 0 ? (
              <MediaGrid items={displayItems} mediaType={actualMediaType} />
            ) : (
              <EmptyState type={isSearching ? 'search' : 'filter'} mediaLabel={mediaLabel} />
            )}

            {/* Infinite scroll trigger - only when not searching */}
            {!isSearching && hasNextPage && displayItems.length > 0 && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {isFetchingNextPage && <LoadingSpinner size="sm" />}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// Main export with Suspense wrapper
export function BrowsePageLayout(props: BrowsePageLayoutProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
            </div>
          </div>
        </main>
      }
    >
      <BrowsePageLayoutInner {...props} />
    </Suspense>
  );
}
