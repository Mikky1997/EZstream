import type { Movie, TVShow, SearchResult, Person, PersonCredits } from "@/types";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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
    append_to_response: "videos,external_ids",
  });
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  return fetchTMDB<TVShow>(`/tv/${id}`, {
    append_to_response: "videos,external_ids",
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

  // Check if we need weighted rating sort
  const useWeightedRating = sortBy === "vote_average.desc";

  // For weighted rating, require more votes to filter out niche content with inflated ratings
  const actualMinVotes = useWeightedRating ? Math.max(minVotes, 500) : minVotes;

  const params: Record<string, string | number | boolean> = {
    sort_by: "popularity.desc", // Always fetch by popularity, we re-sort for weighted
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

  // If using weighted rating, use the helper to fetch and re-sort
  if (useWeightedRating) {
    return fetchWithWeightedRating(
      "/discover/movie",
      params,
      page,
      2000, // Higher threshold for movies (more data available)
      6.5, // Mean rating for movies
    );
  }

  // For non-weighted sorts, use TMDB's native sorting
  return fetchTMDB<SearchResult>("/discover/movie", {
    ...params,
    page,
    sort_by: sortBy,
  });
}

// Calculate weighted rating using IMDB's Bayesian formula
// This prevents shows with few votes from ranking artificially high
function calculateWeightedRating(
  voteAverage: number,
  voteCount: number,
  minVotes: number = 1000,
  meanRating: number = 7.0,
): number {
  // Formula: (v/(v+m)) × R + (m/(v+m)) × C
  // v = vote count, m = minimum votes, R = average rating, C = mean rating
  return (
    (voteCount / (voteCount + minVotes)) * voteAverage +
    (minVotes / (voteCount + minVotes)) * meanRating
  );
}

// Helper to fetch and sort by weighted rating
async function fetchWithWeightedRating(
  endpoint: string,
  params: Record<string, string | number | boolean>,
  page: number,
  minVotesThreshold: number,
  meanRating: number,
): Promise<SearchResult> {
  // Fetch a larger pool of content to properly sort by weighted rating
  // We fetch 5 pages worth of popular content, sort, then paginate
  const poolSize = 5; // 5 TMDB pages = 100 items
  const itemsPerPage = 20;

  // Calculate which TMDB page batch we need
  // Pages 1-5 of our weighted results come from TMDB pages 1-5
  // Pages 6-10 come from TMDB pages 6-10, etc.
  const batchNumber = Math.ceil(page / poolSize);
  const startPage = (batchNumber - 1) * poolSize + 1;
  const pagesToFetch = Array.from(
    { length: poolSize },
    (_, i) => startPage + i,
  );

  const results = await Promise.all(
    pagesToFetch.map((p) =>
      fetchTMDB<SearchResult>(endpoint, { ...params, page: p }),
    ),
  );

  // Combine all results and remove duplicates
  const allItems = results.flatMap((r) => r.results || []);
  const uniqueItems = allItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id),
  );

  // Calculate weighted rating for each item and sort
  const itemsWithWeightedRating = uniqueItems.map((item) => ({
    ...item,
    weighted_rating: calculateWeightedRating(
      item.vote_average || 0,
      item.vote_count || 0,
      minVotesThreshold,
      meanRating,
    ),
  }));

  // Sort by weighted rating descending
  itemsWithWeightedRating.sort((a, b) => b.weighted_rating - a.weighted_rating);

  // Calculate the index within our batch
  const indexInBatch = ((page - 1) % poolSize) * itemsPerPage;
  const paginatedResults = itemsWithWeightedRating.slice(
    indexInBatch,
    indexInBatch + itemsPerPage,
  );

  return {
    page,
    results: paginatedResults,
    total_pages: Math.min(results[0]?.total_pages || 1, 500), // Cap at reasonable number
    total_results: results[0]?.total_results || 0,
  };
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

  // Check if we need weighted rating sort
  const useWeightedRating = sortBy === "vote_average.desc";

  // For weighted rating, require more votes to filter out niche content with inflated ratings
  const actualMinVotes = useWeightedRating ? Math.max(minVotes, 200) : minVotes;

  const params: Record<string, string | number | boolean> = {
    sort_by: "popularity.desc", // Always fetch by popularity, we re-sort for weighted
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

  // If using weighted rating, use the helper to fetch and re-sort
  if (useWeightedRating) {
    return fetchWithWeightedRating(
      "/discover/tv",
      params,
      page,
      1000, // Minimum votes threshold for weighting formula
      7.0, // Mean rating (TMDB average is around 6.5-7.0)
    );
  }

  // For non-weighted sorts, use TMDB's native sorting
  return fetchTMDB<SearchResult>("/discover/tv", {
    ...params,
    page,
    sort_by: sortBy,
  });
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
  page: number = 1
): Promise<{ page: number; results: Person[]; total_pages: number; total_results: number }> {
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
