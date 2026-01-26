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

interface ListItem {
  id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
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

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/watchlist?limit=50');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (
    mediaType: 'movie' | 'tv',
    mediaId: number,
    title: string,
    posterPath: string | null
  ) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType, mediaId, title, posterPath }),
      });
      
      if (response.ok) {
        await fetchWatchlist();
        return true;
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    return false;
  };

  const removeFromWatchlist = async (mediaType: 'movie' | 'tv', mediaId: number) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setWatchlist(prev => prev.filter(item => !(item.media_type === mediaType && item.media_id === mediaId)));
        return true;
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
    return false;
  };

  const isInWatchlist = (mediaType: 'movie' | 'tv', mediaId: number) => {
    return watchlist.some(item => item.media_type === mediaType && item.media_id === mediaId);
  };

  return { watchlist, loading, fetchWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
