"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import VideoPlayer from "@/app/components/VideoPlayer";
import MediaActions from "@/app/components/MediaActions";
import EpisodeList, { type EpisodeListHandle } from "@/app/components/EpisodeList";
import { TVShowControls } from "@/app/components/TVShowControls";
import { useAuth } from "@/app/contexts/AuthContext";
import { getAllEmbedUrls, type EmbedUrl } from "@/lib/vidsrc";
import type {
  Movie,
  TVShow,
  StreamingSource,
} from "@/types";
import { isAnimeContent } from "@/types";
import Image from "next/image";
import Link from "next/link";

// Fetch media content (movie or TV show)
async function fetchMediaContent(type: "movie" | "tv", id: string): Promise<Movie | TVShow> {
  const apiEndpoint = type === "movie" ? `/api/movie/${id}` : `/api/tv/${id}`;
  const response = await fetch(apiEndpoint);
  
  if (!response.ok) {
    throw new Error("Failed to load content");
  }
  
  return response.json();
}

interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

export default function WatchPage() {
  const params = useParams();
  const type = params.type as "movie" | "tv";
  const id = params.id as string;
  const { user } = useAuth();

  // Use React Query for data fetching
  const { data: item, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["media", type, id],
    queryFn: () => fetchMediaContent(type, id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const error = queryError ? "Failed to load content. Please try again." : null;
  // imdbId is added by the API response
  const imdbId = (item as Movie & { imdbId?: string })?.imdbId || null;
  const tmdbId = id;
  const seasons = (type === "tv" && item && "seasons" in item) ? (item as TVShow & { seasons?: Season[] }).seasons || [] : [];

  const [streamingSource, setStreamingSource] =
    useState<StreamingSource | null>(null);
  const [availableSources, setAvailableSources] = useState<EmbedUrl[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  // Season/episode for TV shows
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  // Mobile episode panel
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);

  // Mark as watched state
  const [isMarkedWatched, setIsMarkedWatched] = useState(false);
  const [markingWatched, setMarkingWatched] = useState(false);

  // For saving watch progress
  const lastSavedProgress = useRef<number>(0);
  const hasSavedToHistory = useRef<string>("");
  
  // Ref for source selector dropdown
  const sourceSelectorRef = useRef<HTMLDivElement>(null);
  const sourcePanelRef = useRef<HTMLDivElement>(null);
  const [sourceDropdownRect, setSourceDropdownRect] = useState<DOMRect | null>(null);

  // Ref for EpisodeList to sync watched status
  const episodeListRef = useRef<EpisodeListHandle>(null);

  // Save watch progress periodically
  const saveProgress = useCallback(
    async (progressSeconds: number, durationSeconds: number = 0) => {
      if (!user || !item) return;

      if (Math.abs(progressSeconds - lastSavedProgress.current) < 10) return;

      lastSavedProgress.current = progressSeconds;
      const title = "title" in item ? item.title : item.name;

      try {
        await fetch("/api/user/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: type,
            mediaId: parseInt(id),
            title,
            posterPath: item.poster_path,
            progressSeconds,
            durationSeconds,
            season: type === "tv" ? season : undefined,
            episode: type === "tv" ? episode : undefined,
          }),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    },
    [user, item, type, id, season, episode],
  );

  // Save to watch history when user starts watching
  // Only save once per unique content (movie or episode)
  useEffect(() => {
    if (user && item && streamingSource) {
      const historyKey =
        type === "tv" ? `${type}-${id}-${season}-${episode}` : `${type}-${id}`;

      // Don't save if we've already saved this exact content
      if (hasSavedToHistory.current === historyKey) {
        return;
      }

      hasSavedToHistory.current = historyKey;
      const title = "title" in item ? item.title : item.name;

      fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: type,
          mediaId: parseInt(id),
          title,
          posterPath: item.poster_path,
          progressSeconds: 120,
          durationSeconds: type === "movie" ? 7200 : 2400,
          season: type === "tv" ? season : undefined,
          episode: type === "tv" ? episode : undefined,
        }),
      }).catch(console.error);
    }
  }, [user, item, streamingSource, type, id, season, episode]);

  const updateSourcesForEpisode = useCallback(() => {
    // Check if content is anime for optimized source ordering
    const isAnime = item ? isAnimeContent(item) : false;

    const sources = getAllEmbedUrls(
      imdbId || "",
      tmdbId,
      type,
      season,
      episode,
      isAnime,
    );
    setAvailableSources(sources);
    if (sources.length > 0) {
      setStreamingSource({ type: "vidsrc", url: sources[0].url });
      setCurrentSourceIndex(0);
    }
  }, [imdbId, tmdbId, type, season, episode, item]);

  // Reload sources when season/episode changes
  useEffect(() => {
    if (item) {
      updateSourcesForEpisode();
    }
  }, [item, updateSourcesForEpisode]);

  // Update source dropdown position when opened (for portal)
  useEffect(() => {
    if (showSourceSelector && sourceSelectorRef.current) {
      setSourceDropdownRect(sourceSelectorRef.current.getBoundingClientRect());
    } else {
      setSourceDropdownRect(null);
    }
  }, [showSourceSelector]);

  // Close source selector when clicking outside (include portaled panel)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inSource = sourceSelectorRef.current?.contains(target) || sourcePanelRef.current?.contains(target);
      if (!inSource) setShowSourceSelector(false);
    }
    if (showSourceSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSourceSelector]);

  const handleSelectEpisode = (newSeason: number, newEpisode: number) => {
    setSeason(newSeason);
    setEpisode(newEpisode);
    setShowEpisodePanel(false);
    // Check if new episode is already watched
    if (episodeListRef.current) {
      setIsMarkedWatched(episodeListRef.current.isEpisodeWatched(newSeason, newEpisode));
    } else {
      setIsMarkedWatched(false);
    }
  };

  // Callback when EpisodeList watched status changes
  const handleWatchedChange = useCallback((watchedSeason: number, watchedEpisode: number, watched: boolean) => {
    if (watchedSeason === season && watchedEpisode === episode) {
      setIsMarkedWatched(watched);
    }
  }, [season, episode]);

  // Auto-mark TV episode as watched when streaming starts
  useEffect(() => {
    if (type === "tv" && user && streamingSource && item) {
      const title = item.name;
      // Mark episode as watched via API
      fetch("/api/user/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: parseInt(id),
          season,
          episode,
          title,
          posterPath: item.poster_path,
        }),
      }).then(() => {
        setIsMarkedWatched(true);
      }).catch(console.error);
    }
  }, [type, user, streamingSource, season, episode, item, id]);

  // Mark content as fully watched (removes from Continue Watching)
  const toggleWatched = async () => {
    if (!user || !item || markingWatched) return;

    setMarkingWatched(true);
    const itemTitle = "title" in item ? item.title : item.name;

    try {
      if (type === "tv" && episodeListRef.current) {
        // For TV shows, use EpisodeList methods to sync the episode list UI
        if (isMarkedWatched) {
          await episodeListRef.current.unmarkEpisodeWatched(season, episode);
          setIsMarkedWatched(false);
        } else {
          await episodeListRef.current.markEpisodeWatched(season, episode);
          setIsMarkedWatched(true);
        }
      } else {
        // For movies, use the history API directly
        if (isMarkedWatched) {
          // Unmark as watched - set progress to 0
          await fetch("/api/user/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaType: type,
              mediaId: parseInt(id),
              title: itemTitle,
              posterPath: item.poster_path,
              progressSeconds: 0,
              durationSeconds: 7200,
            }),
          });
          setIsMarkedWatched(false);
        } else {
          // Mark as watched - set progress to full duration
          await fetch("/api/user/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mediaType: type,
              mediaId: parseInt(id),
              title: itemTitle,
              posterPath: item.poster_path,
              progressSeconds: 7200,
              durationSeconds: 7200,
            }),
          });
          setIsMarkedWatched(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle watched status:", error);
    } finally {
      setMarkingWatched(false);
    }
  };

  const switchSource = (index: number) => {
    if (index >= 0 && index < availableSources.length) {
      setCurrentSourceIndex(index);
      setStreamingSource({ type: "vidsrc", url: availableSources[index].url });
      setShowSourceSelector(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400 text-lg">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error && !streamingSource && availableSources.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Content not found</p>
      </div>
    );
  }

  const title = "title" in item ? item.title : item.name;
  const overview = item.overview;
  const currentSource = availableSources[currentSourceIndex];
  const isTVShow = type === "tv";

  const sourceControls = availableSources.length > 0 ? (
    <div ref={sourceSelectorRef} className="relative flex-shrink-0">
      <button
        onClick={() => setShowSourceSelector(!showSourceSelector)}
        className="px-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 flex items-center gap-1 h-9 text-xs sm:text-sm"
      >
        <span className="max-w-[60px] sm:max-w-[80px] truncate">{currentSource?.name}</span>
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showSourceSelector &&
        sourceDropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={sourcePanelRef}
            className="fixed border border-gray-700 rounded-lg shadow-2xl z-[9999] max-h-80 overflow-y-auto w-max min-w-[100px] max-w-[180px] bg-gray-900"
            style={{
              top: sourceDropdownRect.bottom + 8,
              right: typeof window !== "undefined" ? window.innerWidth - sourceDropdownRect.right : undefined,
              left: undefined,
            }}
          >
            {availableSources.map((source, index) => (
              <button
                key={source.source}
                onMouseDown={() => switchSource(index)}
                className={`w-full text-left px-3 py-1.5 truncate transition-colors border-b border-gray-800 last:border-b-0 text-sm ${
                  index === currentSourceIndex
                    ? "source-active"
                    : "text-white hover:bg-gray-700"
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  ) : null;

  // Extract additional metadata
  const releaseYear =
    "release_date" in item
      ? item.release_date?.split("-")[0]
      : "first_air_date" in item
        ? (item as TVShow).first_air_date?.split("-")[0]
        : null;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const genres = item.genres || [];
  const runtime =
    "runtime" in item ? (item as Movie & { runtime?: number }).runtime : null;

  return (
    <div className="min-h-screen bg-gray-900">


      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          <div className="flex flex-col gap-6">
            {/* Video Player & Info */}
            <div className="flex-1 min-w-0">
              {/* Title & Info */}
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {title}
                  {isTVShow && (
                    <span className="text-blue-400 ml-2 text-xl">
                      S{season} E{episode}
                    </span>
                  )}
                </h1>

                {/* Metadata: Ratings, Year, Runtime, Genres */}
                <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                  {/* IMDB Rating (preferred) */}
                  {item.imdbRating && (
                    <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded">
                      <span className="font-bold text-yellow-300">IMDb</span>
                      <span className="font-semibold">{item.imdbRating}</span>
                      {item.imdbVotes && (
                        <span className="text-yellow-500/70 text-xs">
                          ({item.imdbVotes})
                        </span>
                      )}
                    </div>
                  )}
                  {/* Fallback to TMDB rating if no IMDB */}
                  {!item.imdbRating && rating && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{rating}</span>
                    </div>
                  )}
                  {/* Rotten Tomatoes */}
                  {item.rottenTomatoes && (
                    <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-2.5 py-1 rounded">
                      <span className="text-xs">🍅</span>
                      <span className="font-semibold">
                        {item.rottenTomatoes}
                      </span>
                    </div>
                  )}
                  {/* Metascore */}
                  {item.metascore && (
                    <div className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded">
                      <span className="font-bold text-xs">MC</span>
                      <span className="font-semibold">{item.metascore}</span>
                    </div>
                  )}
                  {/* Content Rating (PG-13, R, etc) */}
                  {item.rated && (
                    <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {item.rated}
                    </span>
                  )}
                  {releaseYear && (
                    <span className="text-gray-400">{releaseYear}</span>
                  )}
                  {runtime && (
                    <span className="text-gray-400">
                      {Math.floor(runtime / 60)}h {runtime % 60}m
                    </span>
                  )}
                </div>

                {/* Genres - simple text with dots */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-gray-400 text-xs">
                    {genres.slice(0, 4).map((genre, i) => (
                      <span key={genre.id}>
                        {genre.name}
                        {i < Math.min(genres.length, 4) - 1 && <span className="ml-1.5 text-gray-600">•</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons row */}
                <div className="flex items-center justify-between gap-2 mb-4 flex-nowrap overflow-x-auto">
                  {/* Left side: Controls */}
                  {isTVShow ? (
                    /* TV Show Controls: Trailer, Watchlist, Season, Episode, Mark Watched, Next */
                    seasons.length > 0 && (
                      <TVShowControls
                        mediaId={parseInt(id)}
                        title={title}
                        posterPath={item.poster_path}
                        seasons={seasons}
                        currentSeason={season}
                        currentEpisode={episode}
                        trailerKey={item.trailerKey}
                        onSeasonChange={setSeason}
                        onEpisodeChange={setEpisode}
                        onNextEpisode={() => {
                          const currentSeasonData = seasons.find(s => s.season_number === season);
                          if (currentSeasonData && episode < currentSeasonData.episode_count) {
                            setEpisode(ep => ep + 1);
                          } else {
                            const nextSeason = seasons.find(s => s.season_number === season + 1);
                            if (nextSeason) {
                              setSeason(nextSeason.season_number);
                              setEpisode(1);
                            }
                          }
                        }}
                      />
                    )
                  ) : (
                    /* Movie Controls: Trailer, Watchlist */
                    <div className="flex items-center gap-1.5 flex-nowrap flex-shrink-0">
                      {item.trailerKey && (
                        <a
                          href={`https://www.youtube.com/watch?v=${item.trailerKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </a>
                      )}
                      <MediaActions
                        mediaType={type}
                        mediaId={parseInt(id)}
                        title={title}
                        posterPath={item.poster_path}
                      />
                    </div>
                  )}

                  {/* Right side: Source selector and next source */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">{sourceControls}</div>
                </div>
              </div>

              {/* Video Player */}
              {streamingSource && (
                <div
                  className="bg-black rounded-lg overflow-hidden mb-4"
                  style={{ position: "relative", width: "100%" }}
                >
                  <VideoPlayer source={streamingSource} title={title} />
                </div>
              )}

              {/* Description - under the player */}
              {overview && (
                <p className="text-gray-400 text-sm mb-4">
                  {overview}
                </p>
              )}

              {/* Credits - Netflix style simple links under the player */}
              <div className="mb-4 text-sm space-y-1">
                {/* Director/Creator */}
                {((item.directors?.length ?? 0) > 0 || item.director) && (
                  <div className="flex flex-wrap items-center gap-x-1">
                    <span className="text-gray-500">{type === "tv" ? "Creator:" : "Director:"}</span>
                    {item.directors && item.directors.length > 0 ? (
                      item.directors.map((person, i) => (
                        <span key={person.id}>
                          <Link href={`/person/${person.id}`} className="text-white hover:underline">
                            {person.name}
                          </Link>
                          {i < item.directors!.length - 1 && <span className="text-gray-500">,</span>}
                        </span>
                      ))
                    ) : item.director ? (
                      item.director.split(", ").map((name, i, arr) => (
                        <span key={name}>
                          <Link href={`/?q=${encodeURIComponent(name.trim())}`} className="text-white hover:underline">
                            {name.trim()}
                          </Link>
                          {i < arr.length - 1 && <span className="text-gray-500">,</span>}
                        </span>
                      ))
                    ) : null}
                  </div>
                )}

                {/* Writers */}
                {((item.writers?.length ?? 0) > 0 || item.writer) && (
                  <div className="flex flex-wrap items-center gap-x-1">
                    <span className="text-gray-500">Writers:</span>
                    {item.writers && item.writers.length > 0 ? (
                      item.writers.map((person, i) => (
                        <span key={person.id}>
                          <Link href={`/person/${person.id}`} className="text-white hover:underline">
                            {person.name}
                          </Link>
                          {i < item.writers!.length - 1 && <span className="text-gray-500">,</span>}
                        </span>
                      ))
                    ) : item.writer ? (
                      item.writer.split(", ").slice(0, 5).map((name, i, arr) => {
                        const cleanName = name.replace(/\s*\([^)]*\)/g, "").trim();
                        return (
                          <span key={name}>
                            <Link href={`/?q=${encodeURIComponent(cleanName)}`} className="text-white hover:underline">
                              {name.trim()}
                            </Link>
                            {i < arr.length - 1 && <span className="text-gray-500">,</span>}
                          </span>
                        );
                      })
                    ) : null}
                  </div>
                )}

                {/* Cast / Stars */}
                {item.credits?.cast && item.credits.cast.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-1">
                    <span className="text-gray-500">Stars:</span>
                    {item.credits.cast.slice(0, 5).map((actor, i, arr) => (
                      <span key={actor.id}>
                        <Link href={`/person/${actor.id}`} className="text-white hover:underline">
                          {actor.name}
                        </Link>
                        {i < arr.length - 1 && <span className="text-gray-500">,</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

        
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
