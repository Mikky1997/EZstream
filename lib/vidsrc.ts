import type { StreamingSource } from '@/types';

// Video source providers - simplified without audio type labels
// (audio/subtitle selection is handled by the embedded player itself)
export interface VideoSource {
  name: string;
  baseUrl: string;
  getMovieUrl: (id: string, isImdb: boolean) => string;
  getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) => string;
}

// Best sources first - ordered by reliability
export const VIDEO_SOURCES: Record<string, VideoSource> = {
  // TOP TIER - Most reliable, best quality
  vidsrcme: {
    name: 'VidSrc.me',
    baseUrl: 'https://vidsrcme.ru',
    getMovieUrl: (id: string, isImdb: boolean) => 
      `https://vidsrcme.ru/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrcme.ru/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  moviesapi: {
    name: 'MoviesAPI',
    baseUrl: 'https://moviesapi.club',
    getMovieUrl: (id: string) => 
      `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://moviesapi.club/tv/${id}/${season}/${episode}`,
  },
  vidsrc: {
    name: 'VidSrc.cc',
    baseUrl: 'https://vidsrc.cc',
    getMovieUrl: (id: string, isImdb: boolean) => 
      `https://vidsrc.cc/v2/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrc.cc/v2/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  
  // SECOND TIER - Good reliability
  embedsu: {
    name: 'Embed.su',
    baseUrl: 'https://embed.su',
    getMovieUrl: (id: string) => 
      `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  autoembed: {
    name: 'AutoEmbed',
    baseUrl: 'https://autoembed.cc',
    getMovieUrl: (id: string, isImdb: boolean) => 
      isImdb ? `https://autoembed.cc/embed/movie/${id}` : `https://autoembed.cc/embed/movie/tmdb/${id}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      isImdb ? `https://autoembed.cc/embed/tv/${id}/${season}/${episode}` : `https://autoembed.cc/embed/tv/tmdb/${id}/${season}/${episode}`,
  },
  vidsrcpro: {
    name: 'VidSrc.pro',
    baseUrl: 'https://vidsrc.pro',
    getMovieUrl: (id: string) => 
      `https://vidsrc.pro/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
  },
  
  // THIRD TIER - Backup sources with broader coverage
  superembed: {
    name: 'SuperEmbed',
    baseUrl: 'https://multiembed.mov',
    getMovieUrl: (id: string) => 
      `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  twoembed: {
    name: '2Embed',
    baseUrl: 'https://2embed.cc',
    getMovieUrl: (id: string) => 
      `https://2embed.cc/embed/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  streamsrc: {
    name: 'StreamSRC',
    baseUrl: 'https://streamsrc.cc',
    getMovieUrl: (id: string) => 
      `https://streamsrc.cc/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://streamsrc.cc/embed/tv/${id}/${season}/${episode}`,
  },
};

export type VideoSourceKey = keyof typeof VIDEO_SOURCES;

export interface EmbedUrl {
  source: string;
  url: string;
  name: string;
}

// Get all available embed URLs for a movie/show
export function getAllEmbedUrls(
  id: string,
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): EmbedUrl[] {
  const urls: EmbedUrl[] = [];
  const hasImdb = id && id.startsWith('tt');
  
  for (const [key, source] of Object.entries(VIDEO_SOURCES)) {
    if (type === 'movie') {
      // Try with IMDb ID first if available (more reliable)
      if (hasImdb) {
        urls.push({
          source: key,
          url: source.getMovieUrl(id, true),
          name: source.name,
        });
      } else {
        // Use TMDB ID
        urls.push({
          source: key,
          url: source.getMovieUrl(tmdbId, false),
          name: source.name,
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
        });
      } else {
        urls.push({
          source: key,
          url: source.getTvUrl(tmdbId, s, e, false),
          name: source.name,
        });
      }
    }
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
