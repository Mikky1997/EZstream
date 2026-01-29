"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MovieCard from "@/app/components/MovieCard";
import SearchBar from "@/app/components/SearchBar";
import type { Movie } from "@/types";

const GENRES = [
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
];

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Highest Rated" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" },
  { value: "revenue.desc", label: "Highest Grossing" },
];

const COUNTRY_OPTIONS = [
  { value: "", label: "All Countries", flag: "🌍" },
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

export default function BrowseMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Helper to get effective rating (IMDB preferred, fallback to TMDB)
  const getEffectiveRating = useCallback((movie: Movie) => {
    if (movie.imdbRating && movie.imdbRating !== "N/A") {
      return parseFloat(movie.imdbRating);
    }
    return movie.vote_average || 0;
  }, []);

  const loadMovies = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const isRatingSort = sortBy === "vote_average.desc";

      try {
        // For rating sort: fetch 13 pages (260 items) at once for accurate IMDB sorting
        // For other sorts: normal single page fetch
        if (isRatingSort && reset) {
          const pagesToFetch = Array.from({ length: 13 }, (_, i) => i + 1);
          const fetchPromises = pagesToFetch.map((p) => {
            const params = new URLSearchParams({
              page: p.toString(),
              sort_by: sortBy,
            });
            if (selectedGenre) params.append("genre", selectedGenre.toString());
            if (selectedLanguage) params.append("language", selectedLanguage);
            return fetch(`/api/browse/movies?${params}`).then((r) => r.json());
          });

          const results = await Promise.all(fetchPromises);
          const allMovies = results.flatMap((data) => data.results || []);

          // Remove duplicates by ID
          const uniqueMovies = Array.from(
            new Map(allMovies.map((m) => [m.id, m])).values(),
          );

          // Sort by IMDB rating (accurate sort across all 100 items)
          uniqueMovies.sort(
            (a, b) => getEffectiveRating(b) - getEffectiveRating(a),
          );

          setMovies(uniqueMovies);
          setPage(14); // Next page would be 14
          setHasMore(results[12]?.results?.length >= 20); // Check if last page was full
        } else {
          // Normal fetch for other sort options or loading more
          const params = new URLSearchParams({
            page: currentPage.toString(),
            sort_by: sortBy,
          });

          if (selectedGenre) {
            params.append("genre", selectedGenre.toString());
          }

          if (selectedLanguage) {
            params.append("language", selectedLanguage);
          }

          const response = await fetch(`/api/browse/movies?${params}`);
          if (response.ok) {
            const data = await response.json();
            const newResults = data.results || [];

            if (reset) {
              setMovies(newResults);
              setPage(2);
            } else {
              // Simply append new results
              setMovies((prev) => [...prev, ...newResults]);
              setPage((prev) => prev + 1);
            }
            setHasMore((data.results?.length || 0) >= 20);
          }
        }
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page, sortBy, selectedGenre, selectedLanguage, getEffectiveRating],
  );

  useEffect(() => {
    loadMovies(true);
  }, [selectedGenre, sortBy, selectedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMovies(false);
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
  }, [hasMore, loadingMore, loading, loadMovies]);

  const selectedCountry = COUNTRY_OPTIONS.find(
    (o) => o.value === selectedLanguage,
  );

  // Search handlers
  const handleSearch = (query: string) => {
    // Search is handled by live results
  };

  const handleLiveResults = useCallback((results: unknown[]) => {
    setSearchResults(results as Movie[]);
    setIsSearching(results.length > 0);
  }, []);

  // Show search results or browse results
  const displayMovies = isSearching ? searchResults : movies;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-2">Browse Movies</h1>
        <p className="text-gray-400 mb-4">
          Discover movies from around the world
        </p>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            onLiveResults={handleLiveResults}
            placeholder="Search movies..."
            filterType="movie"
          />
        </div>

        {/* Filters - hide when searching */}
        {!isSearching && (
          <div className="mb-8 space-y-4">
            <div>
              <h3 className="text-gray-400 text-sm mb-2">Country / Language</h3>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedLanguage(option.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                      selectedLanguage === option.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-gray-400 text-sm mb-2">Genre</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGenre(null)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedGenre === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  All
                </button>
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedGenre === genre.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-gray-400 text-sm">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status text */}
        <div className="mb-4 text-sm text-gray-400">
          {isSearching ? (
            <span>
              Found{" "}
              <span className="text-blue-400">{searchResults.length}</span>{" "}
              results
            </span>
          ) : (
            <>
              Showing:{" "}
              <span className="text-blue-400">
                {selectedCountry?.flag} {selectedCountry?.label}
              </span>{" "}
              movies
              {selectedGenre && (
                <span>
                  {" "}
                  in{" "}
                  <span className="text-purple-400">
                    {GENRES.find((g) => g.id === selectedGenre)?.name}
                  </span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Results */}
        {loading && displayMovies.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayMovies.map((movie) => (
                <MovieCard key={movie.id} item={movie} mediaType="movie" />
              ))}
            </div>

            {displayMovies.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400">
                <p className="mb-4">
                  {isSearching
                    ? "No movies found for your search."
                    : "No movies found with these filters."}
                </p>
                <p className="text-sm">
                  {isSearching
                    ? "Try a different search term."
                    : "Try selecting a different country or genre."}
                </p>
              </div>
            )}

            {/* Infinite scroll trigger - only when not searching */}
            {!isSearching && hasMore && displayMovies.length > 0 && (
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
