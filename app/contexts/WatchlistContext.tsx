'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface WatchlistItem {
  id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  loading: boolean;
  isInWatchlist: (mediaType: 'movie' | 'tv', mediaId: number) => boolean;
  addToWatchlist: (mediaType: 'movie' | 'tv', mediaId: number, title: string, posterPath: string | null) => Promise<boolean>;
  removeFromWatchlist: (mediaType: 'movie' | 'tv', mediaId: number) => Promise<boolean>;
  refreshWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
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

  const isInWatchlist = useCallback((mediaType: 'movie' | 'tv', mediaId: number) => {
    return watchlist.some(item => item.media_type === mediaType && item.media_id === mediaId);
  }, [watchlist]);

  const addToWatchlist = async (
    mediaType: 'movie' | 'tv',
    mediaId: number,
    title: string,
    posterPath: string | null
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaType, mediaId, title, posterPath }),
      });
      
      if (response.ok) {
        // Optimistically update local state
        setWatchlist(prev => [
          {
            id: Date.now(), // Temporary ID
            media_type: mediaType,
            media_id: mediaId,
            title,
            poster_path: posterPath,
            added_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        return true;
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    return false;
  };

  const removeFromWatchlist = async (mediaType: 'movie' | 'tv', mediaId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/user/watchlist?mediaType=${mediaType}&mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Optimistically update local state
        setWatchlist(prev => prev.filter(item => !(item.media_type === mediaType && item.media_id === mediaId)));
        return true;
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
    return false;
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      loading,
      isInWatchlist,
      addToWatchlist,
      removeFromWatchlist,
      refreshWatchlist: fetchWatchlist,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlistContext() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlistContext must be used within a WatchlistProvider');
  }
  return context;
}
