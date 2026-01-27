'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/app/components/SearchBar';
import MovieCard from '@/app/components/MovieCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWatchlistContext } from '@/app/contexts/WatchlistContext';
import { useWatchHistory } from '@/app/hooks/useUserLists';
import type { Movie, TVShow } from '@/types';

// Memoized helper component for Continue Watching cards
const ContinueWatchingCard = memo(function ContinueWatchingCard({ 
  item, 
  mediaType, 
  onRemove 
}: { 
  item: { media_id: number; title: string; poster_path: string | null; progress_seconds?: number; duration_seconds?: number; season?: number | null; episode?: number | null }; 
  mediaType: 'movie' | 'tv';
  onRemove?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
    : null;
  
  const progress = item.progress_seconds && item.duration_seconds 
    ? Math.round((item.progress_seconds / item.duration_seconds) * 100) 
    : 0;

  return (
    <div className="group relative">
      <Link href={`/watch/${mediaType}/${item.media_id}${mediaType === 'tv' && item.season && item.episode ? `?s=${item.season}&e=${item.episode}` : ''}`} prefetch={false}>
        <div className="cursor-pointer transform transition-transform duration-300 hover:scale-105 will-change-transform">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 shadow-lg">
            {posterPath ? (
              <>
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gray-800 animate-shimmer flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                )}
                <Image
                  src={posterPath}
                  alt={item.title}
                  fill
                  className={`object-cover group-hover:brightness-110 transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  sizes="154px"
                  loading="lazy"
                  onLoad={() => setIsLoaded(true)}
                  unoptimized
                />
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-red-500 transition-[width] duration-300" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {mediaType === 'tv' && item.season && item.episode && (
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-lg text-xs text-white font-medium">
                S{item.season} E{item.episode}
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="text-white text-sm font-medium line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 left-2 p-1.5 bg-black/70 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

// Memoized helper component for Watchlist cards
const WatchlistCard = memo(function WatchlistCard({ 
  item, 
  mediaType,
  onRemove 
}: { 
  item: { media_id: number; title: string; poster_path: string | null; }; 
  mediaType: 'movie' | 'tv';
  onRemove?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
    : null;

  return (
    <div className="group relative">
      <Link href={`/watch/${mediaType}/${item.media_id}`} prefetch={false}>
        <div className="cursor-pointer transform transition-transform duration-300 hover:scale-105 will-change-transform">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 shadow-lg">
            {posterPath ? (
              <>
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gray-800 animate-shimmer flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                )}
                <Image
                  src={posterPath}
                  alt={item.title}
                  fill
                  className={`object-cover group-hover:brightness-110 transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  sizes="154px"
                  loading="lazy"
                  onLoad={() => setIsLoaded(true)}
                  unoptimized
                />
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <h3 className="text-white text-sm font-medium line-clamp-1">
                {item.title}
              </h3>
            </div>
          </div>
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 left-2 p-1.5 bg-black/70 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { history, removeFromHistory } = useWatchHistory();
  const { watchlist, removeFromWatchlist } = useWatchlistContext();
  
  const [searchResults, setSearchResults] = useState<(Movie | TVShow)[]>([]);
  const [liveResults, setLiveResults] = useState<(Movie | TVShow)[]>([]);
  
  // Mixed feed - movies, TV shows, and anime
  const [feed, setFeed] = useState<Array<{ item: Movie | TVShow; type: 'movie' | 'tv' }>>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingBrowse, setLoadingBrowse] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Memoized continue watching - filter items with > 60s progress
  const continueWatching = useMemo(() => 
    history.filter(item => item.progress_seconds > 60),
    [history]
  );

  // Define callbacks before useEffects that reference them
  const loadInitialFeed = useCallback(async () => {
    setLoadingBrowse(true);
    try {
      // Load from multiple sources in parallel - reduced to 5 calls for faster initial load
      const [trendingMovies, trendingTV, popularMovies, popularTV, animeTV] = await Promise.all([
        fetch('/api/trending?type=movie&page=1').then(r => r.json()),
        fetch('/api/trending?type=tv&page=1').then(r => r.json()),
        fetch('/api/popular?type=movie&page=1').then(r => r.json()),
        fetch('/api/popular?type=tv&page=1').then(r => r.json()),
        fetch('/api/browse/tv?language=ja&genre=16&page=1').then(r => r.json()),
      ]);

      // Mix all results together - use Set for deduplication
      const seen = new Set<number>();
      const mixed: Array<{ item: Movie | TVShow; type: 'movie' | 'tv' }> = [];
      
      const addUnique = (items: (Movie | TVShow)[], type: 'movie' | 'tv', limit: number) => {
        let count = 0;
        for (const item of items) {
          if (count >= limit) break;
          const key = item.id * 10 + (type === 'movie' ? 1 : 2);
          if (!seen.has(key)) {
            seen.add(key);
            mixed.push({ item, type });
            count++;
          }
        }
      };
      
      // Add movies
      addUnique(trendingMovies.results || [], 'movie', 10);
      addUnique(popularMovies.results || [], 'movie', 8);
      
      // Add TV shows
      addUnique(trendingTV.results || [], 'tv', 10);
      addUnique(popularTV.results || [], 'tv', 8);
      
      // Add anime
      addUnique(animeTV.results || [], 'tv', 8);

      // Fisher-Yates shuffle for better randomization
      for (let i = mixed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
      }
      
      setFeed(mixed);
      setPage(2);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoadingBrowse(false);
    }
  }, []);

  const loadMoreFeed = useCallback(async () => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    try {
      // Rotate through different sources for variety
      const sources = [
        { url: '/api/trending?type=movie', type: 'movie' as const },
        { url: '/api/trending?type=tv', type: 'tv' as const },
        { url: '/api/popular?type=movie', type: 'movie' as const },
        { url: '/api/popular?type=tv', type: 'tv' as const },
        { url: '/api/browse/tv?language=ja&genre=16', type: 'tv' as const },
      ];
      
      const sourceIndex = (page - 2) % sources.length;
      const source = sources[sourceIndex];
      const response = await fetch(`${source.url}&page=${page}`);
      
      if (response.ok) {
        const data = await response.json();
        const newItems = (data.results || []).map((item: Movie | TVShow) => ({
          item,
          type: source.type,
        }));
        
        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setFeed(prev => [...prev, ...newItems]);
          setPage(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Failed to load more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page]);

  // Load initial mixed feed
  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  // Infinite scroll observer with throttling
  useEffect(() => {
    if (hasSearched) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingBrowse) {
          loadMoreFeed();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
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
  }, [hasMore, loadingMore, loadingBrowse, hasSearched, loadMoreFeed]);

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {user ? `Welcome back, ${user.displayName}` : 'Discover & Stream'}
          </h1>
          <p className="text-gray-400">
            Movies, TV Shows & Anime
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch} 
            onLiveResults={handleLiveResults}
            loading={loading} 
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent"></div>
          </div>
        )}

        {/* Search Results */}
        {!hasSearched && liveResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Results ({liveResults.length})</h2>
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

        {hasSearched && searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Search Results ({searchResults.length})</h2>
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
          <div className="py-12 text-center text-gray-400">
            <p className="text-lg">No results found</p>
          </div>
        )}

        {/* Browse Content */}
        {!showResults && (
          <>
            {loadingBrowse || authLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Continue Watching */}
                {user && continueWatching.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-red-500">▶</span> Continue Watching
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {continueWatching.slice(0, 6).map((item) => (
                        <ContinueWatchingCard
                          key={`${item.media_type}-${item.media_id}`}
                          item={item}
                          mediaType={item.media_type}
                          onRemove={() => removeFromHistory(item.media_type, item.media_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Watchlist */}
                {user && watchlist.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-blue-500">+</span> My Watchlist
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {watchlist.slice(0, 6).map((item) => (
                        <WatchlistCard
                          key={`${item.media_type}-${item.media_id}`}
                          item={item}
                          mediaType={item.media_type}
                          onRemove={() => removeFromWatchlist(item.media_type, item.media_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mixed Feed - Movies, TV Shows, Anime */}
                {feed.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4">Discover</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {feed.map((entry, index) => (
                        <MovieCard
                          key={`${entry.type}-${entry.item.id}-${index}`}
                          item={entry.item}
                          mediaType={entry.type}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="py-8 text-center">
                  {loadingMore && (
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
