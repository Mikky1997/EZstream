import axios from 'axios';
import type { Movie, TVShow, SearchResult } from '@/types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY is not set in environment variables');
}

const api = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export async function searchMovies(query: string, page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/search/multi', {
      params: {
        query,
        page,
        include_adult: false,
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB search error:', error);
    throw error;
  }
}

export async function getMovieDetails(id: number): Promise<Movie> {
  try {
    const response = await api.get(`/movie/${id}`, {
      params: {
        append_to_response: 'videos,external_ids',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB movie details error:', error);
    throw error;
  }
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  try {
    const response = await api.get(`/tv/${id}`, {
      params: {
        append_to_response: 'videos,external_ids',
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB TV show details error:', error);
    throw error;
  }
}

export async function getIMDbId(mediaType: 'movie' | 'tv', tmdbId: number): Promise<string | null> {
  try {
    const endpoint = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const response = await api.get(endpoint, {
      params: {
        append_to_response: 'external_ids',
      },
    });
    return response.data.external_ids?.imdb_id || null;
  } catch (error) {
    console.error('TMDB IMDb ID error:', error);
    return null;
  }
}

export async function getTrendingMovies(page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/trending/movie/week', {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB trending movies error:', error);
    throw error;
  }
}

export async function getPopularMovies(page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/movie/popular', {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB popular movies error:', error);
    throw error;
  }
}

export async function getTopRatedMovies(page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/movie/top_rated', {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB top rated movies error:', error);
    throw error;
  }
}

export async function getTrendingTV(page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/trending/tv/week', {
      params: { page },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB trending TV error:', error);
    throw error;
  }
}

export async function discoverMovies(region?: string, page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/discover/movie', {
      params: {
        page,
        sort_by: 'popularity.desc',
        include_adult: false,
        ...(region && { region }),
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB discover movies error:', error);
    throw error;
  }
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
  try {
    const { page = 1, genre, sortBy = 'popularity.desc', year, language, minVotes = 100 } = options;
    
    const params: Record<string, string | number | boolean> = {
      page,
      sort_by: sortBy,
      include_adult: false,
      'vote_count.gte': minVotes, // Higher vote count = more popular = more likely to be available
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

    const response = await api.get('/discover/movie', { params });
    return response.data;
  } catch (error) {
    console.error('TMDB discover movies with filters error:', error);
    throw error;
  }
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
  try {
    const { page = 1, genre, sortBy = 'popularity.desc', year, language, minVotes = 50 } = options;
    
    const params: Record<string, string | number | boolean> = {
      page,
      sort_by: sortBy,
      include_adult: false,
      'vote_count.gte': minVotes, // Higher vote count = more popular = more likely to be available
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

    const response = await api.get('/discover/tv', { params });
    return response.data;
  } catch (error) {
    console.error('TMDB discover TV with filters error:', error);
    throw error;
  }
}

export async function getAnime(page: number = 1): Promise<SearchResult> {
  try {
    const response = await api.get('/discover/tv', {
      params: {
        page,
        sort_by: 'popularity.desc',
        include_adult: false,
        with_genres: 16, // Animation
        with_original_language: 'ja', // Japanese
        'vote_count.gte': 50,
      },
    });
    return response.data;
  } catch (error) {
    console.error('TMDB anime error:', error);
    throw error;
  }
}

