'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/contexts/ToastContext';
import MediaActions from './MediaActions';

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

interface TVShowControlsProps {
  mediaId: number;
  title: string;
  posterPath: string | null;
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number;
  trailerKey?: string | null;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
  onNextEpisode: () => void;
}

// Custom dropdown arrow
const DROPDOWN_ARROW = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E`;

export const TVShowControls = memo(function TVShowControls({
  mediaId,
  title,
  posterPath,
  seasons,
  currentSeason,
  currentEpisode,
  trailerKey,
  onSeasonChange,
  onEpisodeChange,
  onNextEpisode,
}: TVShowControlsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>({});
  const [isMarking, setIsMarking] = useState(false);

  // Filter out specials
  const filteredSeasons = seasons
    .filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentSeasonData = filteredSeasons.find(s => s.season_number === currentSeason);
  const episodeCount = currentSeasonData?.episode_count || 0;

  // Generate episode options
  const episodeOptions = Array.from({ length: episodeCount }, (_, i) => ({
    number: i + 1,
    watched: watchedEpisodes[`${currentSeason}-${i + 1}`] || false,
  }));

  // Fetch watched episodes
  const fetchWatchedEpisodes = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/episodes?mediaId=${mediaId}`);
      if (response.ok) {
        const data = await response.json();
        setWatchedEpisodes(data.watched || {});
      }
    } catch (error) {
      console.error('Failed to fetch watched episodes:', error);
    }
  }, [mediaId, user]);

  useEffect(() => {
    fetchWatchedEpisodes();
  }, [fetchWatchedEpisodes]);

  // Check if current episode is watched
  const isCurrentEpisodeWatched = watchedEpisodes[`${currentSeason}-${currentEpisode}`] || false;

  // Check if all episodes in current season are watched
  const isSeasonFullyWatched = episodeOptions.length > 0 && episodeOptions.every(ep => ep.watched);

  // Toggle watched status for single episode
  const toggleWatched = async () => {
    if (!user || isMarking) return;
    setIsMarking(true);

    try {
      if (isCurrentEpisodeWatched) {
        // Unmark
        const response = await fetch(
          `/api/user/episodes?mediaId=${mediaId}&season=${currentSeason}&episode=${currentEpisode}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          setWatchedEpisodes(prev => ({
            ...prev,
            [`${currentSeason}-${currentEpisode}`]: false,
          }));
          showToast('Episode unmarked', 'success');
        }
      } else {
        // Mark as watched
        const response = await fetch('/api/user/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            season: currentSeason,
            episode: currentEpisode,
            title,
            posterPath,
          }),
        });
        if (response.ok) {
          setWatchedEpisodes(prev => ({
            ...prev,
            [`${currentSeason}-${currentEpisode}`]: true,
          }));
          showToast('Episode marked as watched', 'success');
        }
      }
    } catch (error) {
      showToast('Failed to update watched status', 'error');
    } finally {
      setIsMarking(false);
    }
  };

  // Mark entire season as watched
  const markSeasonAsWatched = async () => {
    if (!user || isMarking || !currentSeasonData) return;
    setIsMarking(true);

    try {
      const unwatchedEpisodes = [];
      for (let ep = 1; ep <= currentSeasonData.episode_count; ep++) {
        if (!watchedEpisodes[`${currentSeason}-${ep}`]) {
          unwatchedEpisodes.push(ep);
        }
      }

      if (unwatchedEpisodes.length === 0) {
        showToast('All episodes already watched', 'info');
        setIsMarking(false);
        return;
      }

      // Mark all unwatched episodes
      const promises = unwatchedEpisodes.map(ep => 
        fetch('/api/user/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId,
            season: currentSeason,
            episode: ep,
            title,
            posterPath,
          }),
        })
      );

      await Promise.all(promises);
      
      // Update local state
      const newWatched = { ...watchedEpisodes };
      unwatchedEpisodes.forEach(ep => {
        newWatched[`${currentSeason}-${ep}`] = true;
      });
      setWatchedEpisodes(newWatched);
      showToast(`Marked ${unwatchedEpisodes.length} episodes as watched`, 'success');
    } catch (error) {
      showToast('Failed to mark season', 'error');
    } finally {
      setIsMarking(false);
    }
  };

  // Get next episode info
  const getNextEpisodeInfo = () => {
    if (currentEpisode < episodeCount) {
      return { season: currentSeason, episode: currentEpisode + 1 };
    }
    // Check next season
    const nextSeason = filteredSeasons.find(s => s.season_number === currentSeason + 1);
    if (nextSeason) {
      return { season: nextSeason.season_number, episode: 1 };
    }
    return null;
  };

  const nextEpisodeInfo = getNextEpisodeInfo();

  return (
    <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
      {/* Trailer */}
      {trailerKey && (
        <a
          href={`https://www.youtube.com/watch?v=${trailerKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Trailer
        </a>
      )}

      {/* Watchlist */}
      <MediaActions
        mediaType="tv"
        mediaId={mediaId}
        title={title}
        posterPath={posterPath}
      />

      {/* Season Dropdown */}
      <div className="relative flex-shrink-0">
        <select
          value={currentSeason}
          onChange={(e) => onSeasonChange(parseInt(e.target.value))}
          className="appearance-none bg-gray-800 text-white pl-3 pr-10 py-1.5 rounded-lg border border-gray-700 text-sm focus:border-blue-500 outline-none cursor-pointer bg-no-repeat min-w-[110px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 8px center',
            backgroundSize: '14px 14px',
          }}
        >
          {filteredSeasons.map((season) => {
            // Check if all episodes in this season are watched
            const seasonEpisodes = Array.from({ length: season.episode_count }, (_, i) => i + 1);
            const allWatched = seasonEpisodes.every(ep => watchedEpisodes[`${season.season_number}-${ep}`]);
            
            return (
              <option key={season.season_number} value={season.season_number}>
                {allWatched ? '✓ ' : ''}{season.name || `Season ${season.season_number}`}
              </option>
            );
          })}
        </select>

      </div>

      {/* Episode Dropdown */}
      <div className="relative flex-shrink-0">
        <select
          value={currentEpisode}
          onChange={(e) => onEpisodeChange(parseInt(e.target.value))}
          className="appearance-none bg-gray-800 text-white pl-3 pr-10 py-1.5 rounded-lg border border-gray-700 text-sm focus:border-blue-500 outline-none cursor-pointer bg-no-repeat min-w-[110px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 8px center',
            backgroundSize: '14px 14px',
          }}
        >
          {episodeOptions.map((ep) => (
            <option key={ep.number} value={ep.number}>
              {ep.watched ? '✓ ' : ''}Episode {ep.number}
            </option>
          ))}
        </select>

      </div>

      {/* Mark as Watched Button */}
      {user && (
        <button
          onClick={toggleWatched}
          disabled={isMarking}
          className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all flex-shrink-0 ${
            isCurrentEpisodeWatched
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-700 text-gray-200 hover:bg-green-600 hover:text-white'
          } ${isMarking ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isCurrentEpisodeWatched ? 'Click to unmark' : 'Mark as watched'}
        >
          {isCurrentEpisodeWatched ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Mark Season as Watched Button */}
      {user && currentSeasonData && !isSeasonFullyWatched && (
        <button
          onClick={markSeasonAsWatched}
          disabled={isMarking}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
            isMarking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Mark entire season as watched"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Mark Season</span>
        </button>
      )}

      {/* Next Episode Button */}
      {nextEpisodeInfo && (
        <button
          onClick={onNextEpisode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          <span>Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
});
