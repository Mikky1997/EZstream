export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

// Video/Trailer from TMDB
export interface Video {
  id: string;
  key: string; // YouTube video ID
  name: string;
  site: string; // "YouTube"
  type: string; // "Trailer", "Teaser", "Clip", etc.
  official: boolean;
}

// Cast member for movie/TV credits
export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

// Crew member for movie/TV credits (directors, writers, etc.)
export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  weighted_rating?: number;
  popularity?: number;
  revenue?: number;
  media_type?: "movie" | "tv";
  original_language?: string;
  genres?: Genre[];
  genre_ids?: number[];
  keywords?: { keywords: Keyword[] }; // TMDB keywords (tags)
  tags?: string[]; // Parsed keyword names for display
  runtime?: number;
  tagline?: string;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  // Parsed crew with IDs (for direct linking)
  directors?: CrewMember[];
  writers?: CrewMember[];
  // IMDB/OMDb data
  imdbRating?: string | null;
  imdbVotes?: string | null;
  metascore?: string | null;
  rottenTomatoes?: string | null;
  imdbGenres?: string[] | null;
  director?: string | null; // OMDb string (fallback)
  writer?: string | null; // OMDb string (fallback)
  imdbActors?: string | null;
  rated?: string | null;
  awards?: string | null;
  // Trailers
  videos?: { results: Video[] };
  trailerKey?: string | null; // YouTube video key for main trailer
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count?: number;
  weighted_rating?: number;
  popularity?: number;
  media_type?: "movie" | "tv";
  original_language?: string;
  number_of_seasons?: number;
  seasons?: { season_number: number; episode_count: number }[];
  genres?: Genre[];
  genre_ids?: number[];
  keywords?: { results: Keyword[] }; // TMDB keywords (tags) - TV uses 'results' not 'keywords'
  tags?: string[]; // Parsed keyword names for display
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  // Parsed crew with IDs (for direct linking)
  directors?: CrewMember[];
  writers?: CrewMember[];
  // IMDB/OMDb data
  imdbRating?: string | null;
  imdbVotes?: string | null;
  metascore?: string | null;
  rottenTomatoes?: string | null;
  imdbGenres?: string[] | null;
  director?: string | null; // OMDb string (fallback)
  writer?: string | null; // OMDb string (fallback)
  imdbActors?: string | null;
  rated?: string | null;
  awards?: string | null;
  // Trailers
  videos?: { results: Video[] };
  trailerKey?: string | null; // YouTube video key for main trailer
}

// Animation genre ID in TMDB
export const ANIMATION_GENRE_ID = 16;

// Check if content is anime (Animation genre + Japanese language)
export function isAnimeContent(item: Movie | TVShow): boolean {
  const hasAnimationGenre =
    item.genres?.some((g) => g.id === ANIMATION_GENRE_ID) ||
    item.genre_ids?.includes(ANIMATION_GENRE_ID) ||
    false;

  const isJapanese = item.original_language === "ja";

  // Anime = Animation + Japanese
  return hasAnimationGenre && isJapanese;
}

export interface SearchResult {
  page: number;
  results: (Movie | TVShow)[];
  total_pages: number;
  total_results: number;
}

export interface StreamingSource {
  type: "vidsrc";
  url: string;
  subtitles?: string[];
}

// Person/Actor types
export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  popularity?: number;
  also_known_as?: string[];
  media_type?: "person";
  known_for?: (Movie | TVShow)[];
}

export interface CastCredit {
  id: number;
  title?: string; // for movies
  name?: string; // for TV shows
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  character?: string;
  media_type: "movie" | "tv";
  popularity?: number;
}

export interface CrewCredit {
  id: number;
  title?: string; // for movies
  name?: string; // for TV shows
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  job?: string; // Director, Writer, Producer, etc.
  department?: string;
  media_type: "movie" | "tv";
  popularity?: number;
}

export interface PersonCredits {
  id: number;
  cast: CastCredit[];
  crew: CrewCredit[];
}

export interface PersonSearchResult {
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
}
