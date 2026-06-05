'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
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
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const seasonRef = useRef<HTMLDivElement>(null);
  const episodeRef = useRef<HTMLDivElement>(null);

  // Filter out specials
  const filteredSeasons = seasons
    .filter(s => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  const currentSeasonData = filteredSeasons.find(s => s.season_number === currentSeason);
  const episodeCount = currentSeasonData?.episode_count || 0;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!seasonRef.current?.contains(target)) setShowSeasonDropdown(false);
      if (!episodeRef.current?.contains(target)) setShowEpisodeDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on page scroll, but not when scrolling inside the dropdown panel
  useEffect(() => {
    if (!showSeasonDropdown && !showEpisodeDropdown) return;
    const handleScroll = (event: Event) => {
      const target = event.target as Node;
      if (seasonRef.current?.contains(target) || episodeRef.current?.contains(target)) return;
      setShowSeasonDropdown(false);
      setShowEpisodeDropdown(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [showSeasonDropdown, showEpisodeDropdown]);

  const handleDropdownWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const el = e.currentTarget;
    if (el.scrollHeight <= el.clientHeight) return;
    // Trap wheel inside the panel so the page does not scroll and close the menu
    e.preventDefault();
    el.scrollTop += e.deltaY;
  }, []);

  // Get next episode info
  const getNextEpisodeInfo = () => {
    if (currentEpisode < episodeCount) {
      return { season: currentSeason, episode: currentEpisode + 1 };
    }
    const nextSeason = filteredSeasons.find(s => s.season_number === currentSeason + 1);
    if (nextSeason) return { season: nextSeason.season_number, episode: 1 };
    return null;
  };

  const nextEpisodeInfo = getNextEpisodeInfo();

  return (
    <div className="flex items-center gap-1.5 flex-nowrap flex-shrink-0">
      {/* Trailer */}
      {trailerKey && (
        <a
          href={`https://www.youtube.com/watch?v=${trailerKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      )}

      {/* Watchlist */}
      <MediaActions mediaType="tv" mediaId={mediaId} title={title} posterPath={posterPath} />

      {/* Season Dropdown */}
      <div ref={seasonRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
          className="flex items-center bg-gray-800 text-white pl-2 pr-8 h-9 rounded-lg border border-gray-700 text-sm focus:border-red-500 outline-none min-w-[60px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 8px center',
            backgroundSize: '14px 14px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="text-sm">S{currentSeason}</span>
        </button>
        {showSeasonDropdown && (
          <div
            className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999] min-w-[180px] max-h-60 overflow-y-auto overscroll-contain"
            onWheel={handleDropdownWheel}
          >
            {filteredSeasons.map(season => (
              <div
                key={season.season_number}
                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-gray-700 last:border-0 text-sm ${
                  season.season_number === currentSeason
                    ? 'source-active'
                    : 'text-white dropdown-item-hover'
                }`}
                onMouseDown={() => {
                  onSeasonChange(season.season_number);
                  setShowSeasonDropdown(false);
                }}
              >
                <span className="flex-1 min-w-0">S{season.season_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Episode Dropdown */}
      <div ref={episodeRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowEpisodeDropdown(!showEpisodeDropdown)}
          className="flex items-center bg-gray-800 text-white pl-2 pr-8 h-9 rounded-lg border border-gray-700 text-sm focus:border-red-500 outline-none min-w-[60px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 6px center',
            backgroundSize: '14px 14px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="text-sm">E{currentEpisode}</span>
        </button>
        {showEpisodeDropdown && (
          <div
            className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999] min-w-[160px] max-h-60 overflow-y-auto overscroll-contain"
            onWheel={handleDropdownWheel}
          >
            {Array.from({ length: episodeCount }, (_, i) => i + 1).map(epNum => (
              <div
                key={epNum}
                className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-gray-700 last:border-0 text-sm ${
                  epNum === currentEpisode ? 'source-active' : 'text-white dropdown-item-hover'
                }`}
                onMouseDown={() => {
                  onEpisodeChange(epNum);
                  setShowEpisodeDropdown(false);
                }}
              >
                <span className="flex-1 min-w-0">E{epNum}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Episode - Just Arrow */}
      {nextEpisodeInfo && (
        <button
          onClick={onNextEpisode}
          className="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
          title={`Next: S${nextEpisodeInfo.season} E${nextEpisodeInfo.episode}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
});
