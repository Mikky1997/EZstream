export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
  original_language?: string;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  media_type?: 'movie' | 'tv';
  original_language?: string;
  number_of_seasons?: number;
  seasons?: { season_number: number; episode_count: number }[];
}

export interface SearchResult {
  page: number;
  results: (Movie | TVShow)[];
  total_pages: number;
  total_results: number;
}

export interface StreamingSource {
  type: 'vidsrc';
  url: string;
  subtitles?: string[];
}
