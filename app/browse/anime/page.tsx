"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/app/components/SearchBar";
import { useBrowseMedia } from "@/app/hooks/useBrowseMedia";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import {
  FilterPills,
  MediaGrid,
  LoadingSpinner,
  EmptyState,
  ErrorState,
} from "@/app/components/browse";
import {
  ANIME_CATEGORIES,
  ANIMATION_GENRE_ID,
  JAPANESE_LANGUAGE,
} from "@/lib/constants/browse";
import type { MediaItem, MediaType } from "@/types";

type AnimeTab = "tv" | "movies";

export default function BrowseAnime() {
  // Tab state
  const [activeTab, setActiveTab] = useState<AnimeTab>("tv");

  // Category filter (replaces genre for anime)
  const [selectedCategory, setSelectedCategory] = useState("popular");

  // Search state
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get sort option from selected category
  const currentSortBy =
    ANIME_CATEGORIES.find((c) => c.id === selectedCategory)?.sortBy ||
    "popularity.desc";

  // Determine media type from active tab
  const mediaType: MediaType = activeTab === "tv" ? "tv" : "movie";

  // Fetch anime data with fixed Japanese language and Animation genre
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
    genre: ANIMATION_GENRE_ID,
    language: JAPANESE_LANGUAGE,
    sortBy: currentSortBy,
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

  // Get category name for status text
  const categoryName = ANIME_CATEGORIES.find(
    (c) => c.id === selectedCategory
  )?.name;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-2">Anime</h1>
        <p className="text-gray-400 mb-4">
          Japanese animation series and movies
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={() => {}}
            onLiveResults={handleLiveResults}
            placeholder="Search anime..."
            filterType="anime"
          />
        </div>

        {/* Tab Selector and Filters - hide when searching */}
        {!isSearching && (
          <>
            {/* Tab Selector */}
            <div className="mb-6 flex gap-4">
              <button
                onClick={() => setActiveTab("tv")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "tv"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Anime Series
              </button>
              <button
                onClick={() => setActiveTab("movies")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "movies"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Anime Movies
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <FilterPills
                options={ANIME_CATEGORIES.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                activeColorClass="bg-red-600"
                label="Sort by"
              />
            </div>
          </>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found <span className="text-red-400">{searchResults.length}</span>{" "}
              anime results
            </span>
          ) : (
            <>
              Showing: <span className="text-red-400">{categoryName}</span>{" "}
              {activeTab === "tv" ? "anime series" : "anime movies"}
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ErrorState message="Failed to load anime" onRetry={() => refetch()} />
        )}

        {/* Loading State */}
        {isLoading && displayItems.length === 0 && !error && (
          <LoadingSpinner size="lg" />
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {displayItems.length > 0 ? (
              <MediaGrid
                items={displayItems}
                mediaType={isSearching ? "auto" : mediaType}
              />
            ) : (
              <EmptyState
                type={isSearching ? "search" : "filter"}
                mediaLabel="anime"
                suggestion={
                  isSearching
                    ? "Try a different search term."
                    : "Try selecting a different sort option."
                }
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
