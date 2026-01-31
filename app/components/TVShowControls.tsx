'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
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
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [seasonDropdownRect, setSeasonDropdownRect] = useState<DOMRect | null>(null);
  const [episodeDropdownRect, setEpisodeDropdownRect] = useState<DOMRect | null>(null);
  const seasonRef = useRef<HTMLDivElement>(null);
  const episodeRef = useRef<HTMLDivElement>(null);
  const seasonPanelRef = useRef<HTMLDivElement>(null);
  const episodePanelRef = useRef<HTMLDivElement>(null);

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

  // Update dropdown positions when opened (for portal)
  useEffect(() => {
    if (showSeasonDropdown && seasonRef.current) {
      setSeasonDropdownRect(seasonRef.current.getBoundingClientRect());
    } else {
      setSeasonDropdownRect(null);
    }
  }, [showSeasonDropdown]);
  useEffect(() => {
    if (showEpisodeDropdown && episodeRef.current) {
      setEpisodeDropdownRect(episodeRef.current.getBoundingClientRect());
    } else {
      setEpisodeDropdownRect(null);
    }
  }, [showEpisodeDropdown]);

  // Close dropdowns when clicking outside (include portaled panels)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inSeason = seasonRef.current?.contains(target) || seasonPanelRef.current?.contains(target);
      const inEpisode = episodeRef.current?.contains(target) || episodePanelRef.current?.contains(target);
      if (!inSeason) setShowSeasonDropdown(false);
      if (!inEpisode) setShowEpisodeDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle episode watched status
  const toggleEpisodeWatched = async (ep: number, currentWatched: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isMarking) return;
    setIsMarking(true);

    try {
      if (currentWatched) {
        await fetch(`/api/user/episodes?mediaId=${mediaId}&season=${currentSeason}&episode=${ep}`, {
          method: 'DELETE'
        });
        setWatchedEpisodes(prev => ({ ...prev, [`${currentSeason}-${ep}`]: false }));
      } else {
        await fetch('/api/user/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId, season: currentSeason, episode: ep, title, posterPath }),
        });
        setWatchedEpisodes(prev => ({ ...prev, [`${currentSeason}-${ep}`]: true }));
      }
    } catch {
      showToast('Failed to update', 'error');
    } finally {
      setIsMarking(false);
    }
  };

  // Toggle all episodes in season
  const toggleSeasonWatched = async (seasonNum: number, episodeCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isMarking) return;
    setIsMarking(true);

    const allWatched = Array.from({ length: episodeCount }, (_, i) => i + 1)
      .every(ep => watchedEpisodes[`${seasonNum}-${ep}`]);

    try {
      if (allWatched) {
        // Unmark all
        const promises = Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep =>
          fetch(`/api/user/episodes?mediaId=${mediaId}&season=${seasonNum}&episode=${ep}`, { method: 'DELETE' })
        );
        await Promise.all(promises);
        const newWatched = { ...watchedEpisodes };
        Array.from({ length: episodeCount }, (_, i) => i + 1).forEach(ep => {
          newWatched[`${seasonNum}-${ep}`] = false;
        });
        setWatchedEpisodes(newWatched);
        showToast('Season unmarked', 'success');
      } else {
        // Mark all
        const unwatched = Array.from({ length: episodeCount }, (_, i) => i + 1)
          .filter(ep => !watchedEpisodes[`${seasonNum}-${ep}`]);
        const promises = unwatched.map(ep =>
          fetch('/api/user/episodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaId, season: seasonNum, episode: ep, title, posterPath }),
          })
        );
        await Promise.all(promises);
        const newWatched = { ...watchedEpisodes };
        unwatched.forEach(ep => { newWatched[`${seasonNum}-${ep}`] = true; });
        setWatchedEpisodes(newWatched);
        showToast(`Marked ${unwatched.length} episodes`, 'success');
      }
    } catch {
      showToast('Failed to update season', 'error');
    } finally {
      setIsMarking(false);
    }
  };

  // Check if all episodes in current season are watched
  const isSeasonFullyWatched = episodeOptions.length > 0 && episodeOptions.every(ep => ep.watched);

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

        </a>
      )}

      {/* Watchlist */}
      <MediaActions mediaType="tv" mediaId={mediaId} title={title} posterPath={posterPath} />

      {/* Season Dropdown */}
      <div ref={seasonRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
          className="flex items-center gap-1.5 bg-gray-800 text-white pl-2 pr-8 py-1.5 rounded-lg border border-gray-700 text-sm focus:border-blue-500 outline-none min-w-[60px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 8px center',
            backgroundSize: '14px 14px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="text-sm">S{currentSeason}</span>
        </button>
        {showSeasonDropdown &&
          seasonDropdownRect &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={seasonPanelRef}
              className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999] min-w-[180px] max-h-60 overflow-y-auto"
              style={{
                top: seasonDropdownRect.bottom + 4,
                left: seasonDropdownRect.left,
              }}
            >
              {filteredSeasons.map((season) => {
                const seasonEpisodes = Array.from({ length: season.episode_count }, (_, i) => i + 1);
                const allWatched = seasonEpisodes.every(ep => watchedEpisodes[`${season.season_number}-${ep}`]);
                return (
                  <div
                    key={season.season_number}
                    className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest('button[data-check]')) return;
                      onSeasonChange(season.season_number);
                      setShowSeasonDropdown(false);
                    }}
                  >
                    {user && (
                      <button
                        type="button"
                        data-check
                        onClick={(e) => toggleSeasonWatched(season.season_number, season.episode_count, e)}
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                          allWatched ? 'bg-green-600 border-green-500 text-white' : 'border-gray-500 bg-transparent hover:bg-gray-600'
                        }`}
                        title={allWatched ? 'Mark season unwatched' : 'Mark season watched'}
                        aria-label={allWatched ? 'Mark season unwatched' : 'Mark season watched'}
                      >
                        {allWatched && (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        )}
                      </button>
                    )}
                    <span className="text-sm text-white flex-1 min-w-0">S{season.season_number}</span>
                  </div>
                );
              })}
            </div>,
            document.body
          )}
      </div>

      {/* Episode Dropdown */}
      <div ref={episodeRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowEpisodeDropdown(!showEpisodeDropdown)}
          className="flex items-center gap-1.5 bg-gray-800 text-white pl-2 pr-8 py-1.5 rounded-lg border border-gray-700 text-sm focus:border-blue-500 outline-none min-w-[60px]"
          style={{
            backgroundImage: `url("${DROPDOWN_ARROW}")`,
            backgroundPosition: 'right 6px center',
            backgroundSize: '14px 14px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span className="text-sm">E{currentEpisode}</span>
        </button>
        {showEpisodeDropdown &&
          episodeDropdownRect &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={episodePanelRef}
              className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999] min-w-[160px] max-h-60 overflow-y-auto"
              style={{
                top: episodeDropdownRect.bottom + 4,
                left: episodeDropdownRect.left,
              }}
            >
              {episodeOptions.map((ep) => (
                <div
                  key={ep.number}
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('button[data-check]')) return;
                    onEpisodeChange(ep.number);
                    setShowEpisodeDropdown(false);
                  }}
                >
                  {user && (
                    <button
                      type="button"
                      data-check
                      onClick={(e) => toggleEpisodeWatched(ep.number, ep.watched, e)}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${
                        ep.watched ? 'bg-green-600 border-green-500 text-white' : 'border-gray-500 bg-transparent hover:bg-gray-600'
                      }`}
                      title={ep.watched ? 'Mark episode unwatched' : 'Mark episode watched'}
                      aria-label={ep.watched ? 'Mark episode unwatched' : 'Mark episode watched'}
                    >
                      {ep.watched && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                    </button>
                  )}
                  <span className="text-sm text-white flex-1 min-w-0">E{ep.number}</span>
                </div>
              ))}
            </div>,
            document.body
          )}
      </div>

      {/* Next Episode - Just Arrow */}
      {nextEpisodeInfo && (
        <button
          onClick={onNextEpisode}
          className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
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
