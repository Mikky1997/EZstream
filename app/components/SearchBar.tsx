'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLiveResults?: (results: SearchResult[]) => void;
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  // Filter results by media type: 'movie', 'tv', 'anime' (anime = tv with animation genre)
  filterType?: 'movie' | 'tv' | 'anime' | 'all';
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
  filterType = 'all'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
          } else if (filterType === 'tv') {
            // TV shows but exclude anime (genre 16 = animation, but we can't filter by genre here)
            // Just filter to TV only
            filtered = filtered.filter((item: SearchResult) => item.media_type === 'tv');
          } else if (filterType === 'anime') {
            // Anime = TV shows with Japanese origin (approximate filter)
            filtered = filtered.filter((item: SearchResult) => item.media_type === 'tv');
          }
          
          // Send results directly to parent - Netflix style (no dropdown)
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onLiveResults) {
      onLiveResults([]);
    }
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-6 py-4 text-lg bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-32"
            disabled={loading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
