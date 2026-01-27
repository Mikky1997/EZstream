'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const watchlistRes = await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`);

      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setInWatchlist(data.inWatchlist);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  }, [mediaType, mediaId]);

  // Check initial state
  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user, checkStatus]);

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
        {inWatchlist ? (
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        ) : (
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        )}
        {showLabels && (
          <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        )}
      </button>
    </div>
  );
}
