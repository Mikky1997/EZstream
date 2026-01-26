'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

interface EpisodeListProps {
  mediaId: number;
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number;
  onSelectEpisode: (season: number, episode: number) => void;
  title: string;
  posterPath: string | null;
}

export default function EpisodeList({
  mediaId,
  seasons,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
  title,
  posterPath,
}: EpisodeListProps) {
  const { user } = useAuth();
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Fetch watched episodes
  useEffect(() => {
    if (user) {
      fetchWatchedEpisodes();
    }
  }, [user, mediaId]);

  const fetchWatchedEpisodes = async () => {
    try {
      const response = await fetch(`/api/user/episodes?mediaId=${mediaId}`);
      if (response.ok) {
        const data = await response.json();
        setWatchedEpisodes(data.watched || {});
      }
    } catch (error) {
      console.error('Failed to fetch watched episodes:', error);
    }
  };

  const markAsWatched = async (season: number, episode: number) => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await fetch('/api/user/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId,
          season,
          episode,
          title,
          posterPath,
        }),
      });
      
      setWatchedEpisodes(prev => ({
        ...prev,
        [`${season}-${episode}`]: true,
      }));
    } catch (error) {
      console.error('Failed to mark episode:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out "Specials" season (season 0) and sort
  const filteredSeasons = seasons
    .filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentSeasonData = filteredSeasons.find(s => s.season_number === selectedSeason);
  const episodeCount = currentSeasonData?.episode_count || 10;

  const isWatched = (season: number, episode: number) => {
    return watchedEpisodes[`${season}-${episode}`] || false;
  };

  const isCurrentlyPlaying = (season: number, episode: number) => {
    return season === currentSeason && episode === currentEpisode;
  };

  return (
    <div className="bg-gray-900/95 rounded-lg border border-gray-700 overflow-hidden flex flex-col max-h-[600px]">
      {/* Season Selector */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {filteredSeasons.map((season) => (
            <option key={season.season_number} value={season.season_number}>
              {season.name || `Season ${season.season_number}`}
            </option>
          ))}
        </select>
      </div>

      {/* Episode List - scrollable container */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 space-y-1">
          {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => {
            const watched = isWatched(selectedSeason, ep);
            const playing = isCurrentlyPlaying(selectedSeason, ep);
            
            return (
              <div
                key={ep}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  playing
                    ? 'bg-blue-600 text-white'
                    : watched
                    ? 'bg-green-900/40 text-green-200 hover:bg-green-800/50'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {/* Play button */}
                <button
                  onClick={() => onSelectEpisode(selectedSeason, ep)}
                  className={`flex-1 flex items-center gap-3 text-left ${
                    playing ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    playing 
                      ? 'bg-white/20' 
                      : watched 
                      ? 'bg-green-600' 
                      : 'bg-gray-700'
                  }`}>
                    {playing ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : watched ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{ep}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${playing ? 'text-white' : ''}`}>
                      Episode {ep}
                    </p>
                    {playing && (
                      <p className="text-xs text-blue-200">Now Playing</p>
                    )}
                  </div>
                </button>

                {/* Mark as watched button */}
                {user && !watched && !playing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsWatched(selectedSeason, ep);
                    }}
                    disabled={loading}
                    className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-green-400 transition-colors"
                    title="Mark as watched"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}

                {watched && !playing && (
                  <span className="text-xs text-green-400 px-2">Watched</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {user && (
        <div className="p-3 border-t border-gray-700 bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Watched</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Playing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
