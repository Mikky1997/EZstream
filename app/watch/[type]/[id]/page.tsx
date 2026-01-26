'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/app/components/VideoPlayer';
import MediaActions from '@/app/components/MediaActions';
import { useAuth } from '@/app/contexts/AuthContext';
import { getAllEmbedUrls, getAudioBadgeColor, getAudioLabel, type EmbedUrl } from '@/lib/vidsrc';
import type { Movie, TVShow, StreamingSource } from '@/types';
import Image from 'next/image';

export default function WatchPage() {
  const params = useParams();
  const type = params.type as 'movie' | 'tv';
  const id = params.id as string;
  const { user } = useAuth();

  const [item, setItem] = useState<Movie | TVShow | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [tmdbId, setTmdbId] = useState<string>(id);
  const [streamingSource, setStreamingSource] = useState<StreamingSource | null>(null);
  const [availableSources, setAvailableSources] = useState<EmbedUrl[]>([]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [sourceError, setSourceError] = useState(false);

  // Season/episode for TV shows
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [totalSeasons, setTotalSeasons] = useState(1);
  const [episodesPerSeason, setEpisodesPerSeason] = useState<number[]>([]);

  // For anime content: sub/dub preference
  const [isAnime, setIsAnime] = useState(false);
  const [audioPreference, setAudioPreference] = useState<'sub' | 'dub' | 'all'>('all');

  // For saving watch progress
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgress = useRef<number>(0);

  useEffect(() => {
    loadContent();
    
    // Cleanup interval on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [type, id]);

  // Save watch progress periodically
  const saveProgress = useCallback(async (progressSeconds: number, durationSeconds: number = 0) => {
    if (!user || !item) return;
    
    // Only save if progress changed significantly (more than 10 seconds)
    if (Math.abs(progressSeconds - lastSavedProgress.current) < 10) return;
    
    lastSavedProgress.current = progressSeconds;
    const title = 'title' in item ? item.title : item.name;
    
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: type,
          mediaId: parseInt(id),
          title,
          posterPath: item.poster_path,
          progressSeconds,
          durationSeconds,
          season: type === 'tv' ? season : undefined,
          episode: type === 'tv' ? episode : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [user, item, type, id, season, episode]);

  // Start saving progress when video loads
  useEffect(() => {
    if (user && item && streamingSource) {
      // Save initial view
      const title = 'title' in item ? item.title : item.name;
      fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: type,
          mediaId: parseInt(id),
          title,
          posterPath: item.poster_path,
          progressSeconds: 0,
          durationSeconds: 0,
          season: type === 'tv' ? season : undefined,
          episode: type === 'tv' ? episode : undefined,
        }),
      }).catch(console.error);
    }
  }, [user, item, streamingSource, type, id, season, episode]);

  // Reload sources when season/episode or audio preference changes
  useEffect(() => {
    if (item) {
      updateSourcesForEpisode();
    }
  }, [season, episode, audioPreference, imdbId, tmdbId]);

  const updateSourcesForEpisode = () => {
    const sources = getAllEmbedUrls(
      imdbId || '', 
      tmdbId, 
      type, 
      season, 
      episode, 
      isAnime, 
      isAnime ? audioPreference : undefined
    );
    setAvailableSources(sources);
    if (sources.length > 0) {
      setStreamingSource({ type: 'vidsrc', url: sources[0].url });
      setCurrentSourceIndex(0);
      setSourceError(false);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load movie/TV show details via API
      const apiEndpoint = type === 'movie' ? `/api/movie/${id}` : `/api/tv/${id}`;
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error('Failed to load content');
      }

      const data = await response.json();
      setItem(data);
      setTmdbId(id);
      const imdb = data.imdbId || null;
      setImdbId(imdb);

      // Check if this is anime (Japanese animation)
      const lang = data.original_language || 'en';
      const isAnimeContent = lang === 'ja' && 
        (data.genres?.some((g: { id: number }) => g.id === 16) || // Animation genre
         data.genre_ids?.includes(16));
      setIsAnime(isAnimeContent);
      
      // Set default audio preference for anime
      if (isAnimeContent) {
        setAudioPreference('sub'); // Default to sub for anime
      }

      // For TV shows, get season info
      if (type === 'tv' && data.number_of_seasons) {
        setTotalSeasons(data.number_of_seasons);
        const episodes = data.seasons?.map((s: { episode_count: number }) => s.episode_count || 10) || 
          Array(data.number_of_seasons).fill(10);
        setEpisodesPerSeason(episodes);
      }

      // Get sources
      const sources = getAllEmbedUrls(
        imdb || '', 
        id, 
        type, 
        season, 
        episode, 
        isAnimeContent,
        isAnimeContent ? 'sub' : undefined
      );
      setAvailableSources(sources);

      // Set the primary streaming source
      if (sources.length > 0) {
        setStreamingSource({ type: 'vidsrc', url: sources[0].url });
      }
    } catch (err) {
      setError('Failed to load content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchSource = (index: number) => {
    if (index >= 0 && index < availableSources.length) {
      setCurrentSourceIndex(index);
      setStreamingSource({ type: 'vidsrc', url: availableSources[index].url });
      setShowSourceSelector(false);
      setSourceError(false);
    }
  };

  const tryNextSource = () => {
    const nextIndex = currentSourceIndex + 1;
    if (nextIndex < availableSources.length) {
      switchSource(nextIndex);
    } else {
      setSourceError(true);
    }
  };

  // Count sources by audio type (only for anime/non-English)
  const getAudioCounts = () => {
    const counts = { sub: 0, dub: 0, multi: 0, unknown: 0 };
    availableSources.forEach(s => {
      if (s.audioType) counts[s.audioType]++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400 text-lg">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error && !streamingSource && availableSources.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Content not found</p>
      </div>
    );
  }

  const title = 'title' in item ? item.title : item.name;
  const overview = item.overview;
  const backdropPath = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
    : null;
  const currentSource = availableSources[currentSourceIndex];
  const audioCounts = getAudioCounts();

  return (
    <div className="min-h-screen bg-black">
      {backdropPath && (
        <div className="absolute inset-0 opacity-20">
          <Image
            src={backdropPath}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          {overview && (
            <p className="text-gray-300 max-w-3xl">{overview}</p>
          )}
          {isAnime && (
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-purple-900 text-purple-200 text-sm rounded">
                🎌 Anime
              </span>
            </div>
          )}
          
          {/* Media Actions - Watchlist & Favorites */}
          <div className="mt-4">
            <MediaActions
              mediaType={type}
              mediaId={parseInt(id)}
              title={'title' in item ? item.title : item.name}
              posterPath={item.poster_path}
            />
          </div>
        </div>

        {/* TV Show Season/Episode Selector */}
        {type === 'tv' && (
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-gray-400">Season:</label>
              <select
                value={season}
                onChange={(e) => {
                  setSeason(parseInt(e.target.value));
                  setEpisode(1);
                }}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700"
              >
                {Array.from({ length: totalSeasons }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Season {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400">Episode:</label>
              <select
                value={episode}
                onChange={(e) => setEpisode(parseInt(e.target.value))}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700"
              >
                {Array.from({ length: episodesPerSeason[season - 1] || 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Episode {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Audio Preference Selector - Only for Anime */}
        {isAnime && (
          <div className="mb-6 bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4">
              <h3 className="text-white font-medium">Audio Preference:</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAudioPreference('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    audioPreference === 'all'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAudioPreference('sub')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    audioPreference === 'sub'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>🇯🇵</span>
                  <span>Sub</span>
                </button>
                <button
                  onClick={() => setAudioPreference('dub')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    audioPreference === 'dub'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>🇺🇸</span>
                  <span>Dub</span>
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              SUB = Japanese audio with subtitles | DUB = English dubbed
            </p>
          </div>
        )}

        {/* Source Selector */}
        {availableSources.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowSourceSelector(!showSourceSelector)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700 flex items-center gap-2"
                >
                  <span>Source: {currentSource?.name}</span>
                  {/* Only show audio badge for anime */}
                  {isAnime && currentSource?.audioType && (
                    <span className={`px-2 py-0.5 text-xs rounded ${getAudioBadgeColor(currentSource.audioType)}`}>
                      {getAudioLabel(currentSource.audioType)}
                    </span>
                  )}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSourceSelector && (
                  <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto min-w-[280px]">
                    {availableSources.map((source, index) => (
                      <button
                        key={source.source}
                        onClick={() => switchSource(index)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                          index === currentSourceIndex ? 'bg-blue-900' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={index === currentSourceIndex ? 'text-blue-200' : 'text-white'}>
                            {source.name}
                          </span>
                          {/* Only show audio badge for anime */}
                          {isAnime && source.audioType && (
                            <span className={`px-2 py-0.5 text-xs rounded ${getAudioBadgeColor(source.audioType)}`}>
                              {getAudioLabel(source.audioType)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {currentSourceIndex < availableSources.length - 1 && (
                <button
                  onClick={tryNextSource}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
                >
                  Not working? Try next →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Audio Type Legend - Only for Anime */}
        {isAnime && (
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded ${getAudioBadgeColor('sub')}`}>SUB</span>
              <span className="text-gray-400">Japanese audio + subtitles</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded ${getAudioBadgeColor('dub')}`}>DUB</span>
              <span className="text-gray-400">English dubbed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded ${getAudioBadgeColor('multi')}`}>MULTI</span>
              <span className="text-gray-400">Both options available</span>
            </div>
          </div>
        )}

        {/* Video Player */}
        {streamingSource && (
          <div className="bg-gray-900/90 rounded-lg p-4 mb-6">
            <VideoPlayer
              source={streamingSource}
              title={title}
            />
          </div>
        )}

        {/* Source Error Message */}
        {sourceError && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-200 font-medium mb-2">Content Not Available</h3>
            <p className="text-red-100 text-sm">
              We have tried all available sources but this content does not seem to be available for streaming. 
              This can happen with:
            </p>
            <ul className="text-red-100 text-sm mt-2 list-disc list-inside">
              <li>Very new releases that have not been added to sources yet</li>
              <li>Older or obscure content with limited availability</li>
              <li>Regional content (like some Arabic movies)</li>
            </ul>
            <p className="text-red-100 text-sm mt-2">
              Try searching for a different title or check back later.
            </p>
          </div>
        )}

        {/* Helpful Tips */}
        <div className="bg-gray-900/90 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Tips
          </h3>
          <ul className="text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>If a source does not work, click the Try next button to switch to another source</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>VidSrc.me and MoviesAPI are generally the most reliable sources</span>
            </li>
            {isAnime && (
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Use the audio preference buttons to filter between Sub (Japanese) and Dub (English) sources</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
