'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface MediaActionsProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
  posterPath: string | null;
  showLabels?: boolean;
}

export default function MediaActions({ 
  mediaType, 
  mediaId, 
  title, 
  posterPath,
  showLabels = true 
}: MediaActionsProps) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check initial state
  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user, mediaType, mediaId]);

  const checkStatus = async () => {
    try {
      const [watchlistRes, favoritesRes] = await Promise.all([
        fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`),
        fetch(`/api/user/favorites?mediaType=${mediaType}&mediaId=${mediaId}`),
      ]);

      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setInWatchlist(data.inWatchlist);
      }

      if (favoritesRes.ok) {
        const data = await favoritesRes.json();
        setIsFavorite(data.isFavorite);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      if (inWatchlist) {
        await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`, {
          method: 'DELETE',
        });
        setInWatchlist(false);
      } else {
        await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaType, mediaId, title, posterPath }),
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      if (isFavorite) {
        await fetch(`/api/user/favorites?mediaType=${mediaType}&mediaId=${mediaId}`, {
          method: 'DELETE',
        });
        setIsFavorite(false);
      } else {
        await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaType, mediaId, title, posterPath }),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to update favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Watchlist Button */}
      <button
        onClick={toggleWatchlist}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          inWatchlist
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      >
        <svg 
          className="w-5 h-5" 
          fill={inWatchlist ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        {showLabels && (
          <span>{inWatchlist ? 'In Watchlist' : 'Watch Later'}</span>
        )}
      </button>

      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isFavorite
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <svg 
          className="w-5 h-5" 
          fill={isFavorite ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
        {showLabels && (
          <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
        )}
      </button>
    </div>
  );
}
