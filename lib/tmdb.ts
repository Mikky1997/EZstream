import type {
  Movie,
  TVShow,
  SearchResult,
  Person,
  PersonCredits,
} from "@/types";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Blocklist of adult/hentai anime TMDB IDs that slip through TMDB's adult filter
// These are ecchi/hentai anime that TMDB doesn't properly flag as adult
const BLOCKED_ANIME_IDS = new Set([
  // TV Shows (hentai/borderline hentai)
  91239,   // Overflow
  94954,   // Joshiochi!: 2-kai kara Onnanoko ga... Futtekita!?
  91400,   // Redo of Healer (extreme content)
  128388,  // Overflow 2nd Season
  85819,   // Interspecies Reviewers
  93678,   // Kaifuku Jutsushi no Yarinaoshi
  205006,  // Overflow (2024)
  // Add more IDs as needed
]);

// Filter out blocked content from results
export function filterBlockedContent<T extends { id: number }>(items: T[]): T[] {
  return items.filter(item => !BLOCKED_ANIME_IDS.has(item.id));
}

if (!TMDB_API_KEY) {
  throw new Error("TMDB_API_KEY is not set in environment variables");
}

// Helper function to build URL with query params
function buildUrl(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
): string {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY!);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

// Reusable fetch with error handling
async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
): Promise<T> {
  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    // Enable Next.js caching
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(
      `TMDB API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function searchMovies(
  query: string,
  page: number = 1,
): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/search/multi", {
    query,
    page,
    include_adult: false,
  });
}

export async function getMovieDetails(id: number): Promise<Movie> {
  return fetchTMDB<Movie>(`/movie/${id}`, {
    append_to_response: "videos,external_ids,credits,keywords",
  });
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  return fetchTMDB<TVShow>(`/tv/${id}`, {
    append_to_response: "videos,external_ids,credits,keywords",
  });
}

export async function getIMDbId(
  mediaType: "movie" | "tv",
  tmdbId: number,
): Promise<string | null> {
  try {
    const endpoint =
      mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const data = await fetchTMDB<{ external_ids?: { imdb_id?: string } }>(
      endpoint,
      {
        append_to_response: "external_ids",
      },
    );
    return data.external_ids?.imdb_id || null;
  } catch (error) {
    console.error("TMDB IMDb ID error:", error);
    return null;
  }
}

export async function getTrendingMovies(
  page: number = 1,
): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/trending/movie/week", { page });
}

export async function getPopularMovies(
  page: number = 1,
): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/movie/popular", { page });
}

export async function getTopRatedMovies(
  page: number = 1,
): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/movie/top_rated", { page });
}

export async function getTrendingTV(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/trending/tv/week", { page });
}

export async function discoverMovies(
  region?: string,
  page: number = 1,
): Promise<SearchResult> {
  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: "popularity.desc",
    include_adult: false,
  };

  if (region) {
    params.region = region;
  }

  return fetchTMDB<SearchResult>("/discover/movie", params);
}

export async function discoverMoviesWithFilters(
  options: {
    page?: number;
    genre?: number;
    sortBy?: string;
    year?: number;
    language?: string;
    minVotes?: number;
  } = {},
): Promise<SearchResult> {
  const {
    page = 1,
    genre,
    sortBy = "popularity.desc",
    year,
    language,
    minVotes = 100,
  } = options;

  // For "highest rated", require significantly more votes to filter out
  // niche content with inflated ratings (similar to IMDB's Top 250 approach)
  const isHighestRated = sortBy === "vote_average.desc";
  const actualMinVotes = isHighestRated ? Math.max(minVotes, 2000) : minVotes;

  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
    "vote_count.gte": actualMinVotes,
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

  return fetchTMDB<SearchResult>("/discover/movie", params);
}

export async function discoverTVWithFilters(
  options: {
    page?: number;
    genre?: number;
    sortBy?: string;
    year?: number;
    language?: string;
    minVotes?: number;
  } = {},
): Promise<SearchResult> {
  const {
    page = 1,
    genre,
    sortBy = "popularity.desc",
    year,
    language,
    minVotes = 50,
  } = options;

  // For "highest rated", require significantly more votes to filter out
  // niche content with inflated ratings (similar to IMDB's Top 250 approach)
  const isHighestRated = sortBy === "vote_average.desc";
  const actualMinVotes = isHighestRated ? Math.max(minVotes, 1000) : minVotes;

  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
    "vote_count.gte": actualMinVotes,
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

  return fetchTMDB<SearchResult>("/discover/tv", params);
}

export async function getAnime(page: number = 1): Promise<SearchResult> {
  return fetchTMDB<SearchResult>("/discover/tv", {
    page,
    sort_by: "popularity.desc",
    include_adult: false,
    with_genres: 16,
    with_original_language: "ja",
    "vote_count.gte": 50,
  });
}

// Person/Actor search and details
export async function searchPeople(
  query: string,
  page: number = 1,
): Promise<{
  page: number;
  results: Person[];
  total_pages: number;
  total_results: number;
}> {
  return fetchTMDB("/search/person", {
    query,
    page,
    include_adult: false,
  });
}

export async function getPersonDetails(id: number): Promise<Person> {
  return fetchTMDB<Person>(`/person/${id}`);
}

export async function getPersonCredits(id: number): Promise<PersonCredits> {
  return fetchTMDB<PersonCredits>(`/person/${id}/combined_credits`);
}
