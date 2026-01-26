'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SearchBar from '@/app/components/SearchBar';
import MovieCard from '@/app/components/MovieCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWatchHistory, useWatchlist, useFavorites } from '@/app/hooks/useUserLists';
import type { Movie, TVShow } from '@/types';

// Helper component for user list sections
function UserListCard({ item, mediaType }: { item: { media_id: number; title: string; poster_path: string | null; progress_seconds?: number; duration_seconds?: number; season?: number | null; episode?: number | null }; mediaType: 'movie' | 'tv' }) {
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  
  const progress = item.progress_seconds && item.duration_seconds 
    ? Math.round((item.progress_seconds / item.duration_seconds) * 100) 
    : 0;

  return (
    <Link href={`/watch/${mediaType}/${item.media_id}`}>
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
          {posterPath ? (
            <img
              src={posterPath}
              alt={item.title}
              className="w-full h-full object-cover group-hover:brightness-110 transition-all"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
          {/* Progress bar for continue watching */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-red-600" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
          {/* Episode info for TV */}
          {mediaType === 'tv' && item.season && item.episode && (
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
              S{item.season} E{item.episode}
            </div>
          )}
        </div>
        <div className="px-1">
          <h3 className="text-white text-sm font-medium line-clamp-1 group-hover:text-blue-400 transition-colors">
            {item.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { history } = useWatchHistory();
  const { watchlist } = useWatchlist();
  const { favorites } = useFavorites();
  
  const [searchResults, setSearchResults] = useState<(Movie | TVShow)[]>([]);
  const [liveResults, setLiveResults] = useState<(Movie | TVShow)[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<(Movie | TVShow)[]>([]);
  const [popularMovies, setPopularMovies] = useState<(Movie | TVShow)[]>([]);
  const [trendingTV, setTrendingTV] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBrowse, setLoadingBrowse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load browse content on mount
  useEffect(() => {
    loadBrowseContent();
  }, []);

  const loadBrowseContent = async () => {
    setLoadingBrowse(true);
    try {
      const [trendingRes, popularRes, tvRes] = await Promise.all([
        fetch('/api/trending?type=movie'),
        fetch('/api/popular'),
        fetch('/api/trending?type=tv'),
      ]);

      if (trendingRes.ok) {
        const data = await trendingRes.json();
        setTrendingMovies(data.results?.slice(0, 12) || []);
      }

      if (popularRes.ok) {
        const data = await popularRes.json();
        setPopularMovies(data.results?.slice(0, 12) || []);
      }

      if (tvRes.ok) {
        const data = await tvRes.json();
        setTrendingTV(data.results?.slice(0, 12) || []);
      }
    } catch (err) {
      console.error('Failed to load browse content:', err);
    } finally {
      setLoadingBrowse(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setLiveResults([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveResults = useCallback((results: unknown[]) => {
    setLiveResults(results as (Movie | TVShow)[]);
    if (results.length > 0) {
      setHasSearched(false);
      setSearchResults([]);
    }
  }, []);

  const showResults = (hasSearched && searchResults.length > 0) || liveResults.length > 0 || hasSearched;

  // Filter history items that have meaningful progress (more than 60 seconds watched)
  const continueWatching = history.filter(item => item.progress_seconds > 60);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {user ? `Welcome back, ${user.displayName}` : 'Welcome to StreamFlix'}
          </h1>
          <p className="text-gray-400 text-lg">
            Stream movies, TV shows, and anime - all in one place
          </p>
        </div>

        <SearchBar 
          onSearch={handleSearch} 
          onLiveResults={handleLiveResults}
          loading={loading} 
        />

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-400">Searching...</p>
          </div>
        )}

        {/* Live Search Results */}
        {!hasSearched && liveResults.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">
                Search Results ({liveResults.length})
              </h2>
              <span className="text-sm text-gray-400">
                Press Enter for full search
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {liveResults.slice(0, 18).map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  mediaType={item.media_type || ('title' in item ? 'movie' : 'tv')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full Search Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  mediaType={item.media_type || ('title' in item ? 'movie' : 'tv')}
                />
              ))}
            </div>
          </div>
        )}

        {hasSearched && !loading && searchResults.length === 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p className="text-xl">No results found. Try a different search term.</p>
          </div>
        )}

        {/* Browse Categories - only show when not searching */}
        {!showResults && (
          <>
            {loadingBrowse || authLoading ? (
              <div className="mt-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-gray-400">Loading content...</p>
              </div>
            ) : (
              <>
                {/* Continue Watching - Only for logged in users */}
                {user && continueWatching.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      Continue Watching
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {continueWatching.slice(0, 6).map((item) => (
                        <UserListCard
                          key={`${item.media_type}-${item.media_id}-${item.season}-${item.episode}`}
                          item={item}
                          mediaType={item.media_type}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* My Watchlist - Only for logged in users */}
                {user && watchlist.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      My Watchlist
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {watchlist.slice(0, 6).map((item) => (
                        <UserListCard
                          key={`${item.media_type}-${item.media_id}`}
                          item={item}
                          mediaType={item.media_type}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* My Favorites - Only for logged in users */}
                {user && favorites.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      My Favorites
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {favorites.slice(0, 6).map((item) => (
                        <UserListCard
                          key={`${item.media_type}-${item.media_id}`}
                          item={item}
                          mediaType={item.media_type}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {trendingMovies.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      Trending Movies
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {trendingMovies.map((item) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          mediaType="movie"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {popularMovies.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      Popular Movies
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {popularMovies.map((item) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          mediaType="movie"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {trendingTV.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-semibold text-white mb-4">
                      Trending TV Shows
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {trendingTV.map((item) => (
                        <MovieCard
                          key={item.id}
                          item={item}
                          mediaType="tv"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
