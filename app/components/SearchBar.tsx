'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onLiveResults?: (results: Suggestion[]) => void;
  loading?: boolean;
}

interface Suggestion {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
  original_language?: string;
}

export default function SearchBar({ onSearch, onLiveResults, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions - faster response (150ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (onLiveResults) {
        onLiveResults([]);
      }
      return;
    }

    setLoadingSuggestions(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          const filtered = (data.results || [])
            .filter((item: Suggestion) => item.media_type === 'movie' || item.media_type === 'tv');
          
          // Show suggestions dropdown
          setSuggestions(filtered.slice(0, 8));
          setShowSuggestions(true);
          
          // Also send live results to parent for grid display
          if (onLiveResults) {
            onLiveResults(filtered);
          }
        }
      } catch (err) {
        console.error('Suggestions error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 150); // Faster debounce for more responsive search

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onLiveResults]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      setShowSuggestions(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = () => {
    setShowSuggestions(false);
    setQuery('');
    if (onLiveResults) {
      onLiveResults([]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onLiveResults) {
      onLiveResults([]);
    }
  };

  const getTitle = (item: Suggestion) => item.title || item.name || 'Unknown';
  const getYear = (item: Suggestion) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  return (
    <div ref={wrapperRef} className="max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search movies, TV shows, anime..."
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

      {/* Loading indicator */}
      {loadingSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 text-center">
          <span className="text-xs text-gray-500">Searching...</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loadingSuggestions && suggestions.length === 0 && (
            <div className="p-3 text-center text-gray-400">
              <div className="inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              Searching...
            </div>
          )}
          {suggestions.map((item) => (
            <Link
              key={`${item.media_type}-${item.id}`}
              href={`/watch/${item.media_type}/${item.id}`}
              onClick={handleSuggestionClick}
              className="flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              {item.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                  alt={getTitle(item)}
                  className="w-10 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                  No img
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{getTitle(item)}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    item.media_type === 'movie' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'
                  }`}>
                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                  </span>
                  {getYear(item) && <span>{getYear(item)}</span>}
                  {item.vote_average && item.vote_average > 0 && (
                    <span className="text-yellow-400">★ {item.vote_average.toFixed(1)}</span>
                  )}
                  {item.original_language === 'ar' && (
                    <span className="text-green-400">عربي</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {suggestions.length > 0 && (
            <div className="p-2 text-center border-t border-gray-700">
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  onSearch(query);
                }}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Press Enter for full results →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
