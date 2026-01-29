import type { StreamingSource } from "@/types";

// Video source providers - simplified without audio type labels
// (audio/subtitle selection is handled by the embedded player itself)
export interface VideoSource {
  key: string;
  name: string;
  baseUrl: string;
  getMovieUrl: (id: string, isImdb: boolean) => string;
  getTvUrl: (
    id: string,
    season: number,
    episode: number,
    isImdb: boolean,
  ) => string;
}

// Sources ordered from BEST to WORST - array guarantees order
// VidSrc.me is #1 - most reliable with 87K movies, 19K series, 80% 1080p
export const VIDEO_SOURCES_ORDERED: VideoSource[] = [
  // #1 - VidSrc.me (BEST - auto-updated, 1080p, great support)
  {
    key: "vidsrcme",
    name: "VidSrc.me",
    baseUrl: "https://vidsrcme.ru",
    getMovieUrl: (id: string, isImdb: boolean) =>
      `https://vidsrcme.ru/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrcme.ru/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  // #1b - VidSrc.to (common mirror)
  {
    key: "vidsrcto",
    name: "VidSrc.to",
    baseUrl: "https://vidsrc.to",
    getMovieUrl: (id: string, isImdb: boolean) =>
      `https://vidsrc.to/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrc.to/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  // #2 - Embed.su (very reliable)
  {
    key: "embedsu",
    name: "Embed.su",
    baseUrl: "https://embed.su",
    getMovieUrl: (id: string) => `https://embed.su/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  // #3 - VidSrc.cc (good backup)
  {
    key: "vidsrc",
    name: "VidSrc.cc",
    baseUrl: "https://vidsrc.cc",
    getMovieUrl: (id: string, isImdb: boolean) =>
      `https://vidsrc.cc/v2/embed/movie/${isImdb ? id : `tmdb/${id}`}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://vidsrc.cc/v2/embed/tv/${isImdb ? id : `tmdb/${id}`}/${season}/${episode}`,
  },
  // #4 - MoviesAPI
  {
    key: "moviesapi",
    name: "MoviesAPI",
    baseUrl: "https://moviesapi.club",
    getMovieUrl: (id: string) => `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://moviesapi.club/tv/${id}/${season}/${episode}`,
  },
  // #5 - AutoEmbed
  {
    key: "autoembed",
    name: "AutoEmbed",
    baseUrl: "https://autoembed.cc",
    getMovieUrl: (id: string, isImdb: boolean) =>
      isImdb
        ? `https://autoembed.cc/embed/movie/${id}`
        : `https://autoembed.cc/embed/movie/tmdb/${id}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      isImdb
        ? `https://autoembed.cc/embed/tv/${id}/${season}/${episode}`
        : `https://autoembed.cc/embed/tv/tmdb/${id}/${season}/${episode}`,
  },
  // #6 - VidSrc.pro
  {
    key: "vidsrcpro",
    name: "VidSrc.pro",
    baseUrl: "https://vidsrc.pro",
    getMovieUrl: (id: string) => `https://vidsrc.pro/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.pro/embed/tv/${id}/${season}/${episode}`,
  },
  // #7 - SuperEmbed (multiembed.mov)
  {
    key: "superembed",
    name: "SuperEmbed",
    baseUrl: "https://multiembed.mov",
    getMovieUrl: (id: string) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  // #8 - 2Embed
  {
    key: "twoembed",
    name: "2Embed",
    baseUrl: "https://2embed.cc",
    getMovieUrl: (id: string) => `https://2embed.cc/embed/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  // #9 - StreamSRC (last resort)
  {
    key: "streamsrc",
    name: "StreamSRC",
    baseUrl: "https://streamsrc.cc",
    getMovieUrl: (id: string) => `https://streamsrc.cc/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://streamsrc.cc/embed/tv/${id}/${season}/${episode}`,
  },
];

// Keep object format for backward compatibility
export const VIDEO_SOURCES: Record<string, VideoSource> = Object.fromEntries(
  VIDEO_SOURCES_ORDERED.map((source) => [source.key, source]),
);

export type VideoSourceKey = keyof typeof VIDEO_SOURCES;

export interface EmbedUrl {
  source: string;
  url: string;
  name: string;
}

// Source priority for different content types
// Keys are source keys, values are priority (lower = better)
// VidSrc.me is always #1 - most reliable with best coverage
const ANIME_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1, // VidSrc.me - most reliable, good anime coverage
  vidsrcto: 2, // Mirror
  vidsrc: 3, // VidSrc.cc - reliable backup
  twoembed: 4, // 2Embed good for anime
  embedsu: 5, // Embed.su reliable
  superembed: 6, // MultiEmbed has wide coverage
  vidsrcpro: 7,
  moviesapi: 8,
  autoembed: 9,
  streamsrc: 10,
};

const MOVIE_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1, // VidSrc.me best for movies (87K movies, 1080p)
  vidsrcto: 2, // Mirror
  vidsrc: 3, // VidSrc.cc - reliable backup
  moviesapi: 4, // MoviesAPI - movie focused
  embedsu: 5, // Embed.su reliable
  vidsrcpro: 6,
  superembed: 7,
  twoembed: 8,
  autoembed: 9,
  streamsrc: 10,
};

const TV_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1, // VidSrc.me best for TV (19K series)
  vidsrcto: 2, // Mirror
  vidsrc: 3, // VidSrc.cc - reliable for TV
  vidsrcpro: 4, // VidSrc.pro - TV focused
  embedsu: 5, // Embed.su reliable
  superembed: 6,
  twoembed: 7,
  moviesapi: 8, // MoviesAPI - less TV focused
  autoembed: 9,
  streamsrc: 10,
};

// Get sources ordered for specific content type
function getOrderedSources(
  contentType: "movie" | "tv" | "anime",
): VideoSource[] {
  let priority: Record<string, number>;

  switch (contentType) {
    case "anime":
      priority = ANIME_SOURCE_PRIORITY;
      break;
    case "movie":
      priority = MOVIE_SOURCE_PRIORITY;
      break;
    case "tv":
    default:
      priority = TV_SOURCE_PRIORITY;
      break;
  }

  return [...VIDEO_SOURCES_ORDERED].sort((a, b) => {
    const aPriority = priority[a.key] ?? 99;
    const bPriority = priority[b.key] ?? 99;
    return aPriority - bPriority;
  });
}

// Get all available embed URLs for a movie/show (ordered best to worst)
// Pass isAnime=true for anime content to get optimized source order
export function getAllEmbedUrls(
  id: string,
  tmdbId: string,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
  isAnime?: boolean,
): EmbedUrl[] {
  const urls: EmbedUrl[] = [];
  const hasImdb = id && id.startsWith("tt");

  // Get sources in optimal order for content type
  const contentType = isAnime ? "anime" : type;
  const orderedSources = getOrderedSources(contentType);

  for (const source of orderedSources) {
    if (type === "movie") {
      // Try with IMDb ID first if available (more reliable)
      if (hasImdb) {
        urls.push({
          source: source.key,
          url: source.getMovieUrl(id, true),
          name: source.name,
        });
      } else {
        // Use TMDB ID
        urls.push({
          source: source.key,
          url: source.getMovieUrl(tmdbId, false),
          name: source.name,
        });
      }
    } else {
      const s = season || 1;
      const e = episode || 1;
      if (hasImdb) {
        urls.push({
          source: source.key,
          url: source.getTvUrl(id, s, e, true),
          name: source.name,
        });
      } else {
        urls.push({
          source: source.key,
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
  type: "movie" | "tv",
  season?: number,
  episode?: number,
): string {
  const source = VIDEO_SOURCES.vidsrcme;
  const isImdb = id.startsWith("tt");

  if (type === "movie") {
    return source.getMovieUrl(id, isImdb);
  } else {
    return source.getTvUrl(id, season || 1, episode || 1, isImdb);
  }
}

export function createStreamingSource(
  id: string,
  type: "movie" | "tv",
  season?: number,
  episode?: number,
): StreamingSource {
  return {
    type: "vidsrc",
    url: getVidSrcEmbedUrl(id, type, season, episode),
  };
}
