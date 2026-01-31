"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path?: string;
  profile_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  known_for_department?: string;
}

export interface UseSearchOptions {
  /** Debounce delay in ms (default: 200) */
  debounceMs?: number;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
  /** Maximum results to return (default: 8) */
  maxResults?: number;
  /** Filter by media type */
  filterType?: "movie" | "tv" | "all";
  /** Include people in results */
  includePeople?: boolean;
}

export interface UseSearchReturn {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResult[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Whether the search is active (has results or is searching) */
  isActive: boolean;
  /** Clear the search */
  clear: () => void;
  /** Get title from a search result */
  getTitle: (item: SearchResult) => string;
}

/**
 * Hook for debounced search with live results
 * Consolidates search logic from Navbar and SearchBar
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, isSearching, clear } = useSearch({
 *   filterType: "movie",
 *   maxResults: 10,
 * });
 * ```
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 200,
    minQueryLength = 2,
    maxResults = 8,
    filterType = "all",
    includePeople = false,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear results if query too short
    if (query.trim().length < minQueryLength) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );

        if (response.ok) {
          const data = await response.json();

          // Build allowed media types
          const allowedTypes = ["movie", "tv"];
          if (includePeople) {
            allowedTypes.push("person");
          }

          let filtered = (data.results || []).filter((item: SearchResult) =>
            allowedTypes.includes(item.media_type || "")
          );

          // Apply filterType filtering
          if (filterType === "movie") {
            filtered = filtered.filter(
              (item: SearchResult) => item.media_type === "movie"
            );
          } else if (filterType === "tv") {
            filtered = filtered.filter(
              (item: SearchResult) => item.media_type === "tv"
            );
          }

          // Limit results
          setResults(filtered.slice(0, maxResults));
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, minQueryLength, maxResults, filterType, includePeople]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsSearching(false);
  }, []);

  const getTitle = useCallback(
    (item: SearchResult) => item.title || item.name || "Unknown",
    []
  );

  const isActive =
    results.length > 0 ||
    isSearching ||
    (query.trim().length >= minQueryLength && !isSearching && results.length === 0);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isActive,
    clear,
    getTitle,
  };
}
