'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLiveResults?: (results: SearchResult[]) => void;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  filterType?: 'movie' | 'tv' | 'anime' | 'all';
  initialQuery?: string;
}

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export default function SearchBar({ 
  onSearch, 
  onLiveResults, 
  loading, 
  placeholder = "Search movies, TV shows, anime...",
  autoFocus = false,
  filterType = 'all',
  initialQuery = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update query when initialQuery changes (from URL param)
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Debounced live search - results go directly to parent (no dropdown)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      if (onLiveResults) {
        onLiveResults([]);
      }
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          let filtered = (data.results || [])
            .filter((item: SearchResult) => item.media_type === 'movie' || item.media_type === 'tv');
          
          // Apply filterType filtering
          if (filterType === 'movie') {
            filtered = filtered.filter((item: SearchResult) => item.media_type === 'movie');
          } else if (filterType === 'tv' || filterType === 'anime') {
            filtered = filtered.filter((item: SearchResult) => item.media_type === 'tv');
          }
          
          if (onLiveResults) {
            onLiveResults(filtered);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onLiveResults, filterType]);

  const handleClear = () => {
    setQuery('');
    if (onLiveResults) {
      onLiveResults([]);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative">
        {/* Search icon on the left */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          disabled={loading}
        />
        {/* Clear button on the right */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
            title="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
