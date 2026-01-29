"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MovieCard from "@/app/components/MovieCard";
import SearchBar from "@/app/components/SearchBar";
import type { TVShow } from "@/types";

const ANIME_CATEGORIES = [
  { id: "popular", name: "Popular", sortBy: "popularity.desc" },
  { id: "top_rated", name: "Top Rated", sortBy: "vote_average.desc" },
  { id: "new", name: "New Releases", sortBy: "first_air_date.desc" },
];

export default function BrowseAnime() {
  const [anime, setAnime] = useState<TVShow[]>([]);
  const [movies, setMovies] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [activeTab, setActiveTab] = useState<"tv" | "movies">("tv");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<TVShow[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Helper to get effective rating (IMDB preferred, fallback to TMDB)
  const getEffectiveRating = useCallback((item: TVShow) => {
    if (item.imdbRating && item.imdbRating !== "N/A") {
      return parseFloat(item.imdbRating);
    }
    return item.vote_average || 0;
  }, []);

  const loadAnime = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const category = ANIME_CATEGORIES.find((c) => c.id === selectedCategory);
      const currentSortBy = category?.sortBy || "popularity.desc";
      const isRatingSort = currentSortBy === "vote_average.desc";
      const endpoint =
        activeTab === "tv" ? "/api/browse/tv" : "/api/browse/movies";

      try {
        // For rating sort: fetch 10 pages (200 items), sort by IMDB, show top 100
        // This gives a larger pool for more accurate IMDB top 100
        if (isRatingSort && reset) {
          const pagesToFetch = Array.from({ length: 10 }, (_, i) => i + 1);
          const fetchPromises = pagesToFetch.map((p) => {
            const params = new URLSearchParams({
              page: p.toString(),
              sort_by: currentSortBy,
              language: "ja",
              genre: "16",
            });
            return fetch(`${endpoint}?${params}`).then((r) => r.json());
          });

          const results = await Promise.all(fetchPromises);
          const allItems = results.flatMap((data) => data.results || []);

          // Remove duplicates by ID
          const uniqueItems = Array.from(
            new Map(allItems.map((item) => [item.id, item])).values(),
          );

          // Sort by IMDB rating and take top 100
          uniqueItems.sort(
            (a, b) => getEffectiveRating(b) - getEffectiveRating(a),
          );
          const top100 = uniqueItems.slice(0, 100);

          if (activeTab === "tv") {
            setAnime(top100);
          } else {
            setMovies(top100);
          }
          setPage(11);
          setHasMore(false); // No infinite scroll for rating sort - show top 100 only
        } else {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            sort_by: currentSortBy,
            language: "ja",
            genre: "16",
          });

          const response = await fetch(`${endpoint}?${params}`);

          if (response.ok) {
            const data = await response.json();
            const newResults = data.results || [];

            if (reset) {
              if (activeTab === "tv") {
                setAnime(newResults);
              } else {
                setMovies(newResults);
              }
              setPage(2);
            } else {
              // Simply append new results
              if (activeTab === "tv") {
                setAnime((prev) => [...prev, ...newResults]);
              } else {
                setMovies((prev) => [...prev, ...newResults]);
              }
              setPage((prev) => prev + 1);
            }
            const hasMoreResults =
              typeof data?.page === "number" &&
              typeof data?.total_pages === "number"
                ? data.page < data.total_pages
                : (data.results?.length || 0) >= 20;
            setHasMore(hasMoreResults);
          }
        }
      } catch (err) {
        console.error("Failed to load anime:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, selectedCategory, activeTab, getEffectiveRating],
  );

  useEffect(() => {
    loadAnime(true);
  }, [selectedCategory, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading &&
          !isSearching
        ) {
          loadAnime(false);
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loading, loadAnime, isSearching]);

  // Search handlers
  const handleSearch = (query: string) => {
    // Search is handled by live results
  };

  const handleLiveResults = useCallback((results: unknown[]) => {
    setSearchResults(results as TVShow[]);
    setIsSearching(results.length > 0);
  }, []);

  const currentItems = activeTab === "tv" ? anime : movies;
  const displayItems = isSearching ? searchResults : currentItems;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Anime</h1>
        <p className="text-gray-400 mb-4">
          Japanese animation series and movies
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
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
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                📺 Anime Series
              </button>
              <button
                onClick={() => setActiveTab("movies")}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "movies"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                🎬 Anime Movies
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="text-gray-400 text-sm mb-2">Sort by</h3>
              <div className="flex flex-wrap gap-2">
                {ANIME_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found{" "}
              <span className="text-purple-400">{searchResults.length}</span>{" "}
              anime results
            </span>
          ) : (
            <>
              Showing:{" "}
              <span className="text-purple-400">
                {ANIME_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </span>{" "}
              {activeTab === "tv" ? "anime series" : "anime movies"}
            </>
          )}
        </div>

        {/* Results */}
        {loading && displayItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayItems.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  mediaType={
                    isSearching
                      ? (item.media_type as "movie" | "tv") || "tv"
                      : activeTab === "tv"
                        ? "tv"
                        : "movie"
                  }
                />
              ))}
            </div>

            {displayItems.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400">
                <p className="mb-4">
                  {isSearching
                    ? "No anime found for your search."
                    : "No anime found in this category."}
                </p>
                <p className="text-sm">
                  {isSearching
                    ? "Try a different search term."
                    : "Try selecting a different sort option."}
                </p>
              </div>
            )}

            {/* Infinite scroll trigger - only when not searching */}
            {!isSearching && hasMore && displayItems.length > 0 && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {loadingMore && (
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
