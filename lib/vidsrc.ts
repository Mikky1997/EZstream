import type { StreamingSource } from "@/types";

// Video source providers - simplified without audio type labels
// (audio/subtitle selection is handled by the embedded player itself)
export interface VideoSource {
  key: string;
  name: string;
  baseUrl: string;
  idType: "tmdb" | "imdb-or-tmdb";
  getMovieUrl: (id: string, isImdb: boolean) => string;
  getTvUrl: (
    id: string,
    season: number,
    episode: number,
    isImdb: boolean,
  ) => string;
}

// Default ordering. Availability still depends on the title and provider.
// Retired domains are omitted rather than offered as working alternatives.
export const VIDEO_SOURCES_ORDERED: VideoSource[] = [
  {
    key: "vidsrcme",
    name: "VidSrc",
    baseUrl: "https://vidsrc.sh",
    idType: "imdb-or-tmdb",
    getMovieUrl: (id: string) => `https://vidsrc.sh/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.sh/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: "vidsrc",
    name: "VidSrc.cc",
    baseUrl: "https://vidsrc.cc",
    idType: "imdb-or-tmdb",
    getMovieUrl: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: "vidsrcto",
    name: "VidSrc.to",
    baseUrl: "https://vidsrc.to",
    idType: "imdb-or-tmdb",
    getMovieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: "vidlink",
    name: "VidLink",
    baseUrl: "https://vidlink.pro",
    idType: "tmdb",
    getMovieUrl: (id: string) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
  {
    key: "superembed",
    name: "SuperEmbed",
    baseUrl: "https://multiembed.mov",
    idType: "imdb-or-tmdb",
    getMovieUrl: (id: string, isImdb: boolean) =>
      `https://multiembed.mov/?video_id=${id}${isImdb ? "" : "&tmdb=1"}`,
    getTvUrl: (id: string, season: number, episode: number, isImdb: boolean) =>
      `https://multiembed.mov/?video_id=${id}${isImdb ? "" : "&tmdb=1"}&s=${season}&e=${episode}`,
  },
  {
    key: "twoembed",
    name: "2Embed",
    baseUrl: "https://2embed.cc",
    idType: "imdb-or-tmdb",
    getMovieUrl: (id: string) => `https://2embed.cc/embed/${id}`,
    getTvUrl: (id: string, season: number, episode: number) =>
      `https://2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
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
// Prefer reachable providers before providers that may require a browser challenge.
const ANIME_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidlink: 2,
  twoembed: 3,
  vidsrc: 4,
  superembed: 5,
  vidsrcto: 6,
};

const MOVIE_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidlink: 2,
  twoembed: 3,
  vidsrc: 4,
  superembed: 5,
  vidsrcto: 6,
};

const TV_SOURCE_PRIORITY: Record<string, number> = {
  vidsrcme: 1,
  vidlink: 2,
  twoembed: 3,
  vidsrc: 4,
  superembed: 5,
  vidsrcto: 6,
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
  const contentType = isAnime ? "anime" : type;
  const s = season !== undefined && Number.isInteger(season) && season >= 0 ? season : 1;
  const e = episode !== undefined && Number.isInteger(episode) && episode > 0 ? episode : 1;

  return getOrderedSources(contentType).map((source) => {
    const useImdb = source.idType === "imdb-or-tmdb" && /^tt\d+$/.test(id);
    const sourceId = useImdb ? id : tmdbId;
    return {
      source: source.key,
      name: source.name,
      url: type === "movie"
        ? source.getMovieUrl(sourceId, useImdb)
        : source.getTvUrl(sourceId, s, e, useImdb),
    };
  });
}

// Get the primary embed URL using the current VidSrc domain
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
    return source.getTvUrl(id, season ?? 1, episode ?? 1, isImdb);
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
