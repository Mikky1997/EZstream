import type { Movie, TVShow, SearchResult } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

// Helper function to build URL with query params
function buildUrl(endpoint: string, params: Record<string, string | number | boolean> = {}): string {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY!);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  
  return url.toString();
}

// Reusable fetch with error handling
async function fetchTMDB<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
  const url = buildUrl(endpoint, params);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
    // Enable Next.js caching
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchMovies(query: string, page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/search/multi', {
    query,
    page,
    include_adult: false,
  });
}

export async function getMovieDetails(id: number): Promise<Movie> {
  return fetchTMDB<Movie>(`/movie/${id}`, {
    append_to_response: 'videos,external_ids',
  });
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  return fetchTMDB<TVShow>(`/tv/${id}`, {
    append_to_response: 'videos,external_ids',
  });
}

export async function getIMDbId(mediaType: 'movie' | 'tv', tmdbId: number): Promise<string | null> {
  try {
    const endpoint = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const data = await fetchTMDB<{ external_ids?: { imdb_id?: string } }>(endpoint, {
      append_to_response: 'external_ids',
    });
    return data.external_ids?.imdb_id || null;
  } catch (error) {
    console.error('TMDB IMDb ID error:', error);
    return null;
  }
}

export async function getTrendingMovies(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/trending/movie/week', { page });
}

export async function getPopularMovies(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/movie/popular', { page });
}

export async function getTopRatedMovies(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/movie/top_rated', { page });
}

export async function getTrendingTV(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/trending/tv/week', { page });
}

export async function discoverMovies(region?: string, page: number = 1): Promise<SearchResult> {
  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: 'popularity.desc',
    include_adult: false,
  };
  
  if (region) {
    params.region = region;
  }
  
  return fetchTMDB<SearchResult>('/discover/movie', params);
}

export async function discoverMoviesWithFilters(
  options: {
    page?: number;
    genre?: number;
    sortBy?: string;
    year?: number;
    language?: string;
    minVotes?: number;
  } = {}
): Promise<SearchResult> {
  const { page = 1, genre, sortBy = 'popularity.desc', year, language, minVotes = 100 } = options;
  
  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
    'vote_count.gte': minVotes,
  };

  if (genre) {
    params.with_genres = genre;
  }
  if (year) {
    params.primary_release_year = year;
  }
  if (language) {
    params.with_original_language = language;
  }

  return fetchTMDB<SearchResult>('/discover/movie', params);
}

export async function discoverTVWithFilters(
  options: {
    page?: number;
    genre?: number;
    sortBy?: string;
    year?: number;
    language?: string;
    minVotes?: number;
  } = {}
): Promise<SearchResult> {
  const { page = 1, genre, sortBy = 'popularity.desc', year, language, minVotes = 50 } = options;
  
  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
    'vote_count.gte': minVotes,
  };

  if (genre) {
    params.with_genres = genre;
  }
  if (year) {
    params.first_air_date_year = year;
  }
  if (language) {
    params.with_original_language = language;
  }

  return fetchTMDB<SearchResult>('/discover/tv', params);
}

export async function getAnime(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>('/discover/tv', {
    page,
    sort_by: 'popularity.desc',
    include_adult: false,
    with_genres: 16,
    with_original_language: 'ja',
    'vote_count.gte': 50,
  });
}

