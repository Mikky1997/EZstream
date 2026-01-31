'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';

interface MediaActionsProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  title: string;
  posterPath: string | null;
}

// Fetch watchlist status
async function fetchWatchlistStatus(mediaType: string, mediaId: number): Promise<{ inWatchlist: boolean }> {
  const response = await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`);
  if (!response.ok) {
    throw new Error('Failed to check watchlist status');
  }
  return response.json();
}

export default function MediaActions({ 
  mediaType, 
  mediaId, 
  title, 
  posterPath,
}: MediaActionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Use React Query for watchlist status
  const { data } = useQuery({
    queryKey: ['watchlist-status', mediaType, mediaId],
    queryFn: () => fetchWatchlistStatus(mediaType, mediaId),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  const inWatchlist = optimisticState !== null ? optimisticState : (data?.inWatchlist || false);

  // Mutation for toggling watchlist
  const mutation = useMutation({
    mutationFn: async () => {
      if (inWatchlist) {
        await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`, {
          method: 'DELETE',
        });
        return false;
      } else {
        await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaType, mediaId, title, posterPath }),
        });
        return true;
      }
    },
    onMutate: async () => {
      // Optimistic update
      setOptimisticState(!inWatchlist);
    },
    onSuccess: (newState) => {
      // Update cache
      queryClient.setQueryData(['watchlist-status', mediaType, mediaId], { inWatchlist: newState });
      setOptimisticState(null);
    },
    onError: () => {
      // Revert optimistic update
      setOptimisticState(null);
    },
  });

  const toggleWatchlist = () => {
    if (!user || mutation.isPending) return;
    mutation.mutate();
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleWatchlist}
      disabled={mutation.isPending}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
        inWatchlist
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      } ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
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
