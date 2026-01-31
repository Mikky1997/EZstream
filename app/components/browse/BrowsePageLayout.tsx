"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/app/components/SearchBar";
import { useBrowseMedia } from "@/app/hooks/useBrowseMedia";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import {
  FilterPills,
  FilterDropdown,
  MediaGrid,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from "@/app/components/browse";
import { COUNTRY_OPTIONS, DEFAULT_SORT } from "@/lib/constants/browse";
import type { MediaType, MediaItem, GenreOption, SortOption } from "@/types";

interface BrowsePageLayoutProps {
  /** Page title */
  title: string;
  /** Page subtitle/description */
  subtitle: string;
  /** Media type for this page */
  mediaType: MediaType;
  /** Available genres for this media type */
  genres: readonly GenreOption[];
  /** Available sort options */
  sortOptions: readonly SortOption[];
  /** Year options for the filter */
  yearOptions: readonly { value: string; label: string }[];
  /** Accent color for active filters */
  accentColor?: "blue" | "red" | "purple";
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
 *   title="Browse Movies"
 *   subtitle="Discover movies from around the world"
 *   mediaType="movie"
 *   genres={MOVIE_GENRES}
 *   sortOptions={MOVIE_SORT_OPTIONS}
 *   yearOptions={MOVIE_YEAR_OPTIONS}
 *   accentColor="blue"
 *   searchPlaceholder="Search movies..."
 *   searchFilterType="movie"
 *   mediaLabel="movies"
 * />
 * ```
 */
export function BrowsePageLayout({
  title,
  subtitle,
  mediaType,
  genres,
  sortOptions,
  yearOptions,
  accentColor = "blue",
  searchPlaceholder = "Search...",
  searchFilterType = "all",
  mediaLabel = "items",
  showCountryFilter = true,
}: BrowsePageLayoutProps) {
  // Filter state
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Search state
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Accent color classes
  const accentColorClass = {
    blue: "bg-blue-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
  }[accentColor];

  const accentTextClass = {
    blue: "text-blue-400",
    red: "text-red-400",
    purple: "text-purple-400",
  }[accentColor];

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
    genre: selectedGenre,
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
  const selectedGenreName = genres.find((g) => g.id === selectedGenre)?.name;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 mb-4">{subtitle}</p>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={() => {}}
            onLiveResults={handleLiveResults}
            placeholder={searchPlaceholder}
            filterType={searchFilterType}
          />
        </div>

        {/* Filters - hide when searching */}
        {!isSearching && (
          <div className="mb-8 space-y-4 overflow-visible">
            {/* Country/Language Filter */}
            {showCountryFilter && (
              <FilterPills
                options={COUNTRY_OPTIONS}
                selected={selectedLanguage}
                onSelect={setSelectedLanguage}
                activeColorClass={accentColorClass}
                label="Country / Language"
              />
            )}

            {/* Genre Filter */}
            <FilterPills
              options={genres}
              selected={selectedGenre}
              onSelect={setSelectedGenre}
              showAllOption
              allLabel="All"
              activeColorClass={accentColorClass}
              label="Genre"
            />

            {/* Year and Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-4">
              <FilterDropdown
                label="Year"
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                className="text-base"
              />
              <FilterDropdown
                label="Sort by"
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>
          </div>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found <span className={accentTextClass}>{searchResults.length}</span>{" "}
              results
            </span>
          ) : (
            <>
              Showing:{" "}
              <span className={accentTextClass}>
                {selectedCountry?.flag} {selectedCountry?.label}
              </span>{" "}
              {mediaLabel}
              {selectedGenreName && (
                <span>
                  {" "}
                  in <span className="text-purple-400">{selectedGenreName}</span>
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
