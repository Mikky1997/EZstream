"use client";

import { useState, useCallback, useMemo } from "react";
import SearchBar from "@/app/components/SearchBar";
import { useBrowseMedia } from "@/app/hooks/useBrowseMedia";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import {
  FilterDropdown,
  MediaGrid,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from "@/app/components/browse";
import { COUNTRY_OPTIONS, DEFAULT_SORT } from "@/lib/constants/browse";
import type { MediaType, MediaItem, GenreOption, SortOption } from "@/types";

interface BrowsePageLayoutProps {
  /** Media type for this page */
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
  searchFilterType?: "movie" | "tv" | "anime" | "all";
  /** Label for media items (e.g., "movies", "TV shows") */
  mediaLabel?: string;
  /** Whether to show country/language filter */
  showCountryFilter?: boolean;
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
export function BrowsePageLayout({
  mediaType,
  genres,
  sortOptions,
  yearOptions,
  searchPlaceholder = "Search...",
  searchFilterType = "all",
  mediaLabel = "items",
  showCountryFilter = true,
}: BrowsePageLayoutProps) {
  // Filter state
  const [selectedGenre, setSelectedGenre] = useState("");
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Search state
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Convert genre options to dropdown format
  const genreDropdownOptions = useMemo(() => [
    { value: "", label: "All Genres" },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ], [genres]);

  // Convert country options to dropdown format (already has value/label, just add flag to label)
  const countryDropdownOptions = useMemo(() => 
    COUNTRY_OPTIONS.map((c) => ({ 
      value: c.value, 
      label: c.flag ? `${c.flag} ${c.label}` : c.label 
    })),
  []);

  // Fetch data using TanStack Query
  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  } = useBrowseMedia({
    mediaType,
    genre: selectedGenre ? parseInt(selectedGenre, 10) : null,
    language: selectedLanguage,
    year: selectedYear,
    sortBy,
    enabled: !isSearching,
  });

  // Infinite scroll
  const loadMoreRef = useInfiniteScroll(() => fetchNextPage(), {
    enabled: hasNextPage && !isFetchingNextPage && !isLoading && !isSearching,
  });

  // Search handlers
  const handleLiveResults = useCallback((results: unknown[]) => {
    setSearchResults(results as MediaItem[]);
    setIsSearching(results.length > 0);
  }, []);

  // Show search results or browse results
  const displayItems = isSearching ? searchResults : items;

  // Get selected country info for status text
  const selectedCountry = COUNTRY_OPTIONS.find(
    (o) => o.value === selectedLanguage
  );

  // Get selected genre name for status text
  const selectedGenreName = selectedGenre 
    ? genres.find((g) => g.id === parseInt(selectedGenre, 10))?.name 
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
            {/* Country/Language Filter */}
            {showCountryFilter && (
              <FilterDropdown
                label="Country"
                options={countryDropdownOptions}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
              />
            )}

            {/* Genre Filter */}
            <FilterDropdown
              label="Genre"
              options={genreDropdownOptions}
              value={selectedGenre}
              onChange={setSelectedGenre}
            />

            {/* Year Filter */}
            <FilterDropdown
              label="Year"
              options={yearOptions}
              value={selectedYear}
              onChange={setSelectedYear}
            />

            {/* Sort Filter */}
            <FilterDropdown
              label="Sort by"
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found <span className="text-accent">{searchResults.length}</span>{" "}
              results
            </span>
          ) : (
            <>
              Showing:{" "}
              <span className="text-accent">
                {selectedCountry?.flag} {selectedCountry?.label}
              </span>{" "}
              {mediaLabel}
              {selectedGenreName && (
                <span>
                  {" "}
                  in <span className="text-accent">{selectedGenreName}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ErrorState
            message={`Failed to load ${mediaLabel}`}
            onRetry={() => refetch()}
          />
        )}

        {/* Loading State */}
        {isLoading && displayItems.length === 0 && !error && (
          <LoadingSpinner size="lg" />
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {displayItems.length > 0 ? (
              <MediaGrid items={displayItems} mediaType={mediaType} />
            ) : (
              <EmptyState
                type={isSearching ? "search" : "filter"}
                mediaLabel={mediaLabel}
              />
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
