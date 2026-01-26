import type { StreamingSource } from '@/types';

// Audio type for each source - only relevant for non-English content
export type AudioType = 'sub' | 'dub' | 'multi' | 'unknown';

// Content type for source ordering
export type ContentType = 'movie' | 'tv' | 'anime';

// Video source providers
export interface VideoSource {
  name: string;
  baseUrl: string;
  audioType: AudioType; // Only used for anime/non-English content
  getMovieUrl: (id: string, isImdb: boolean) => string;
  getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) => string;
}

// Best sources first - ordered by reliability
// VidSrc.me and MoviesAPI are most reliable for movies
export const VIDEO_SOURCES: Record<string, VideoSource> = {
  // TOP TIER - Most reliable, best quality
  vidsrcme: {
    name: 'VidSrc.me',
    baseUrl: 'https://vidsrcme.ru',
    audioType: 'multi',
    getMovieUrl: (id: string, isImdb: boolean) => 
      `https://vidsrcme.ru/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrcme.ru/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  moviesapi: {
    name: 'MoviesAPI',
    baseUrl: 'https://moviesapi.club',
    audioType: 'multi',
    getMovieUrl: (id: string) => 
      `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://moviesapi.club/tv/${id}/${season}/${episode}`,
  },
  vidsrc: {
    name: 'VidSrc.cc',
    baseUrl: 'https://vidsrc.cc',
    audioType: 'multi',
    getMovieUrl: (id: string, isImdb: boolean) => 
      `https://vidsrc.cc/v2/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrc.cc/v2/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  
  // SECOND TIER - Good reliability
  embedsu: {
    name: 'Embed.su',
    baseUrl: 'https://embed.su',
    audioType: 'multi',
    getMovieUrl: (id: string) => 
      `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  autoembed: {
    name: 'AutoEmbed',
    baseUrl: 'https://autoembed.cc',
    audioType: 'multi',
    getMovieUrl: (id: string, isImdb: boolean) => 
      isImdb ? `https://autoembed.cc/embed/movie/${id}` : `https://autoembed.cc/embed/movie/tmdb/${id}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      isImdb ? `https://autoembed.cc/embed/tv/${id}/${season}/${episode}` : `https://autoembed.cc/embed/tv/tmdb/${id}/${season}/${episode}`,
  },
  vidsrcpro: {
    name: 'VidSrc.pro',
    baseUrl: 'https://vidsrc.pro',
    audioType: 'multi',
    getMovieUrl: (id: string) => 
      `https://vidsrc.pro/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
  },
  
  // THIRD TIER - Backup sources
  twoembed: {
    name: '2Embed',
    baseUrl: 'https://2embed.cc',
    audioType: 'multi',
    getMovieUrl: (id: string) => 
      `https://2embed.cc/embed/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  multiembed: {
    name: 'MultiEmbed',
    baseUrl: 'https://multiembed.mov',
    audioType: 'multi',
    getMovieUrl: (id: string) => 
      `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
};

// Anime-specific sources - prioritized for anime content
// SUB = Japanese audio with subtitles, DUB = English dubbed
export const ANIME_SOURCES: Record<string, VideoSource & { animeAudioType: AudioType }> = {
  vidsrcme: { ...VIDEO_SOURCES.vidsrcme, animeAudioType: 'multi' },
  vidsrc: { ...VIDEO_SOURCES.vidsrc, animeAudioType: 'sub' },
  autoembed: { ...VIDEO_SOURCES.autoembed, animeAudioType: 'multi' },
  embedsu: { ...VIDEO_SOURCES.embedsu, animeAudioType: 'multi' },
  moviesapi: { ...VIDEO_SOURCES.moviesapi, animeAudioType: 'dub' },
  twoembed: { ...VIDEO_SOURCES.twoembed, animeAudioType: 'dub' },
};

export type VideoSourceKey = keyof typeof VIDEO_SOURCES;

export interface EmbedUrl {
  source: string;
  url: string;
  name: string;
  audioType?: AudioType; // Only set for anime/non-English content
}

// Languages that should show sub/dub options
export const LANGUAGES_WITH_SUB_DUB = ['ja', 'ko', 'tr', 'ar', 'zh', 'hi', 'th'];

// Check if content should show sub/dub options
export function shouldShowSubDub(originalLanguage: string): boolean {
  return LANGUAGES_WITH_SUB_DUB.includes(originalLanguage);
}

// Get all available embed URLs for a movie/show
// For regular movies/TV: just list sources without audio type
// For anime/non-English: include audio type info
export function getAllEmbedUrls(
  id: string,
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  isAnime: boolean = false,
  audioPreference?: 'sub' | 'dub' | 'all'
): EmbedUrl[] {
  const urls: EmbedUrl[] = [];
  const hasImdb = id && id.startsWith('tt');
  
  // Use anime sources for anime content
  const sourcesToUse = isAnime ? ANIME_SOURCES : VIDEO_SOURCES;
  
  for (const [key, source] of Object.entries(sourcesToUse)) {
    // For anime, filter by audio preference
    if (isAnime && audioPreference && audioPreference !== 'all') {
      const animeSource = source as (typeof ANIME_SOURCES)[keyof typeof ANIME_SOURCES];
      const audioType = animeSource.animeAudioType || source.audioType;
      if (audioPreference === 'dub' && audioType === 'sub') continue;
      if (audioPreference === 'sub' && audioType === 'dub') continue;
    }
    
    const animeAudioType = isAnime 
      ? ((source as any).animeAudioType || source.audioType) 
      : undefined;
    
    if (type === 'movie') {
      // Try with IMDb ID first if available (more reliable)
      if (hasImdb) {
        urls.push({
          source: key,
          url: source.getMovieUrl(id, true),
          name: source.name,
          audioType: animeAudioType,
        });
      } else {
        // Use TMDB ID
        urls.push({
          source: key,
          url: source.getMovieUrl(tmdbId, false),
          name: source.name,
          audioType: animeAudioType,
        });
      }
    } else {
      const s = season || 1;
      const e = episode || 1;
      if (hasImdb) {
        urls.push({
          source: key,
          url: source.getTvUrl(id, s, e, true),
          name: source.name,
          audioType: animeAudioType,
        });
      } else {
        urls.push({
          source: key,
          url: source.getTvUrl(tmdbId, s, e, false),
          name: source.name,
          audioType: animeAudioType,
        });
      }
    }
  }
  
  // For anime, sort by audio preference
  if (isAnime && audioPreference && audioPreference !== 'all') {
    urls.sort((a, b) => {
      const getScore = (audioType?: AudioType) => {
        if (!audioType) return 2;
        if (audioType === audioPreference) return 0;
        if (audioType === 'multi') return 1;
        return 3;
      };
      return getScore(a.audioType) - getScore(b.audioType);
    });
  }
  
  return urls;
}

// Get primary embed URL (vidsrcme.ru is most reliable)
export function getVidSrcEmbedUrl(
  id: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string {
  const source = VIDEO_SOURCES.vidsrcme;
  const isImdb = id.startsWith('tt');
  
  if (type === 'movie') {
    return source.getMovieUrl(id, isImdb);
  } else {
    return source.getTvUrl(id, season || 1, episode || 1, isImdb);
  }
}

export function createStreamingSource(
  id: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): StreamingSource {
  return {
    type: 'vidsrc',
    url: getVidSrcEmbedUrl(id, type, season, episode),
  };
}

// Get audio type badge color (only for anime/non-English content)
export function getAudioBadgeColor(audioType: AudioType): string {
  switch (audioType) {
    case 'dub': return 'bg-blue-600 text-blue-100';
    case 'sub': return 'bg-purple-600 text-purple-100';
    case 'multi': return 'bg-green-600 text-green-100';
    default: return 'bg-gray-600 text-gray-100';
  }
}

// Get audio type label
export function getAudioLabel(audioType: AudioType): string {
  switch (audioType) {
    case 'dub': return 'DUB';
    case 'sub': return 'SUB';
    case 'multi': return 'MULTI';
    default: return '';
  }
}
