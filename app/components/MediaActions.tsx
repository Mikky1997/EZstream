'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWatchlistContext } from '@/app/contexts/WatchlistContext';

interface MediaActionsProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
  posterPath: string | null;
}

export default function MediaActions({ 
  mediaType, 
  mediaId, 
  title, 
  posterPath,
}: MediaActionsProps) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistContext();
  const [isPending, setIsPending] = useState(false);

  const inWatchlist = isInWatchlist(mediaType, mediaId);

  const toggleWatchlist = useCallback(async () => {
    if (!user || isPending) return;
    setIsPending(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(mediaType, mediaId);
      } else {
        await addToWatchlist(mediaType, mediaId, title, posterPath);
      }
    } finally {
      setIsPending(false);
    }
  }, [
    user,
    isPending,
    inWatchlist,
    mediaType,
    mediaId,
    title,
    posterPath,
    addToWatchlist,
    removeFromWatchlist,
  ]);

  if (!user) return null;

  return (
    <button
      onClick={toggleWatchlist}
      disabled={isPending}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
        inWatchlist
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
    >
      {inWatchlist ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}
