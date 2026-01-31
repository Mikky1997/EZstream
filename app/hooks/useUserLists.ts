'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface HistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  season: number | null;
  episode: number | null;
  progress_seconds: number;
  duration_seconds: number;
  last_watched_at: string;
}

export function useWatchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh when page becomes visible (e.g., navigating back from watch page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchHistory]);

  const updateProgress = async (
    mediaType: 'movie' | 'tv',
    mediaId: number,
    title: string,
    posterPath: string | null,
    progressSeconds: number,
    durationSeconds: number,
    season?: number,
    episode?: number
  ) => {
    if (!user) return;

    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType,
          mediaId,
          title,
          posterPath,
          progressSeconds,
          durationSeconds,
          season,
          episode,
        }),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const removeFromHistory = async (mediaType: 'movie' | 'tv', mediaId: number) => {
    if (!user) return;

    try {
      await fetch(`/api/user/history?mediaType=${mediaType}&mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      setHistory(prev => prev.filter(item => !(item.media_type === mediaType && item.media_id === mediaId)));
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  };

  return { history, loading, fetchHistory, updateProgress, removeFromHistory };
}
