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
// VidSrc.me is #1 default (better reachability)
export const VIDEO_SOURCES_ORDERED: VideoSource[] = [
  // #1 - VidSrc.me (BEST default - better reachability)
  {
    key: "vidsrcme",
    name: "VidSrc.me",
    baseUrl: "https://vidsrcme.ru",
    getMovieUrl: (id: string) => `https://vidsrcme.ru/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrcme.ru/embed/tv/${id}/${season}/${episode}`,
  },
  // #2 - VidSrc.cc (fewer ads)
  {
    key: "vidsrc",
    name: "VidSrc.cc",
    baseUrl: "https://vidsrc.cc",
    getMovieUrl: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  // #3 - VidSrc.to (common mirror)
  {
    key: "vidsrcto",
    name: "VidSrc.to",
    baseUrl: "https://vidsrc.to",
    getMovieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
  },
  // #4 - VidSrc.in (stable mirror)
  {
    key: "vidsrcin",
    name: "VidSrc.in",
    baseUrl: "https://vidsrc.in",
    getMovieUrl: (id: string) => `https://vidsrc.in/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.in/embed/tv/${id}/${season}/${episode}`,
  },
  // #5 - VidLink.pro
  {
    key: "vidlink",
    name: "VidLink",
    baseUrl: "https://vidlink.pro",
    getMovieUrl: (id: string) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
  // #6 - MoviesAPI
  {
    key: "moviesapi",
    name: "MoviesAPI",
    baseUrl: "https://moviesapi.club",
    getMovieUrl: (id: string) => `https://moviesapi.club/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://moviesapi.club/tv/${id}/${season}/${episode}`,
  },
  // #7 - AutoEmbed
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
  // #8 - VidSrc.icu
  {
    key: "vidsrcicu",
    name: "VidSrc.icu",
    baseUrl: "https://vidsrc.icu",
    getMovieUrl: (id: string) => `https://vidsrc.icu/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`,
  },
  // #9 - SuperEmbed (multiembed.mov)
  {
    key: "superembed",
    name: "SuperEmbed",
    baseUrl: "https://multiembed.mov",
    getMovieUrl: (id: string) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  // #10 - 2Embed
  {
    key: "twoembed",
    name: "2Embed",
    baseUrl: "https://2embed.cc",
    getMovieUrl: (id: string) => `https://2embed.cc/embed/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  // #11 - VidSrc.rip (last resort)
  {
    key: "vidsrcrip",
    name: "VidSrc.rip",
    baseUrl: "https://vidsrc.rip",
    getMovieUrl: (id: string) => `https://vidsrc.rip/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.rip/embed/tv/${id}/${season}/${episode}`,
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
// VidSrc.me is #1 default
const ANIME_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidsrcin: 2,
  vidsrc: 3,
  vidsrcto: 4,
  twoembed: 5,
  vidlink: 6,
  superembed: 7,
  vidsrcicu: 8,
  moviesapi: 9,
  autoembed: 10,
  vidsrcrip: 11,
};

const MOVIE_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidsrcin: 2,
  vidsrc: 3,
  vidsrcto: 4,
  moviesapi: 5,
  vidlink: 6,
  vidsrcicu: 7,
  superembed: 8,
  twoembed: 9,
  autoembed: 10,
  vidsrcrip: 11,
};

const TV_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidsrcin: 2,
  vidsrc: 3,
  vidsrcto: 4,
  vidlink: 5,
  vidsrcicu: 6,
  superembed: 7,
  twoembed: 8,
  moviesapi: 9,
  autoembed: 10,
  vidsrcrip: 11,
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

// Get primary embed URL (default to VidSrc.me for reachability)
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
