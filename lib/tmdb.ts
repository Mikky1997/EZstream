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
  // ===== HENTAI (explicit adult content) =====
  91239, // Overflow
  128388, // Overflow 2nd Season
  205006, // Overflow (2024)
  94954, // Joshiochi!: 2-kai kara Onnanoko ga... Futtekita!?
  241002, // Adam's Sweet Agony (Modaete yo, Adam-kun)
  95785, // Toshi Densetsu Series
  93163, // Otome Dori
  73129, // Eroge! H mo Game mo Kaihatsu Zanmai
  77464, // Real Eroge Situation! The Animation
  66926, // Valkyrie Drive: Mermaid
  207840, // Harem Camp!
  128926, // World's End Harem
  87739, // World's End Harem (alternate)
  68339, // Testament of Sister New Devil
  77214, // Testament of Sister New Devil Burst
  90353, // Mother of the Goddess' Dormitory
  95842, // Miru Tights
  93167, // How Heavy Are the Dumbbells You Lift? (censored but borderline)

  // ===== BORDERLINE HENTAI (extreme ecchi/near-explicit) =====
  91400, // Redo of Healer (extreme content)
  93678, // Kaifuku Jutsushi no Yarinaoshi (same as above, alternate ID)
  85819, // Interspecies Reviewers (Ishuzoku Reviewers)
  99080, // Peter Grill and the Philosopher's Time
  68005, // Yosuga no Sora
  114477, // Harem in the Labyrinth of Another World (Isekai Meikyuu de Harem wo)
  74070, // High School DxD (all seasons - extreme ecchi)
  62745, // High School DxD New
  68671, // High School DxD BorN
  77250, // High School DxD Hero
  62861, // To LOVE-Ru Darkness
  62738, // To LOVE-Ru Darkness 2nd
  90354, // Why the Hell are You Here, Teacher!?
  94119, // Rent-a-Girlfriend (borderline)
  88336, // Domestic Girlfriend
  65171, // Prison School
  91600, // Uzaki-chan Wants to Hang Out! (borderline)
  210527, // Ayakashi Triangle
  219345, // The Café Terrace and Its Goddesses

  // ===== Add more IDs as needed =====
]);

// Title patterns that indicate adult/hentai content (case-insensitive)
// NOTE: Only use VERY specific patterns - IDs are more reliable for blocking
const BLOCKED_TITLE_PATTERNS = [
  /\bhentai\b/i, // Explicit genre label in title
  /\beroge\b/i, // Erotic game adaptations
  /adam'?s?\s+sweet\s+agony/i, // Adam's Sweet Agony
  /modaete.*adam/i, // Japanese title of Adam's Sweet Agony
  /joshiochi.*2-kai/i, // Joshiochi specific title
  /toshi\s+densetsu\s+series/i, // Toshi Densetsu Series (specific)
  /otome\s+dori/i, // Otome Dori (specific)
  /world'?s?\s+end\s+harem/i, // World's End Harem
  /shuumatsu\s+no\s+harem/i, // World's End Harem (Japanese)
  /overflow/i, // Overflow series
  /\becchi\b/i, // Ecchi in title usually means explicit
  /testament.*sister.*devil/i, // Testament of Sister New Devil
  /mother.*goddess.*dormitory/i, // Mother of the Goddess' Dormitory
  /interspecies\s+reviewers?/i, // Interspecies Reviewers
  /ishuzoku\s+reviewers?/i, // Interspecies Reviewers (Japanese)
  /peter\s+grill/i, // Peter Grill series
  /redo.*healer/i, // Redo of Healer
  /kaifuku.*jutsushi/i, // Redo of Healer (Japanese)
];

// Filter out blocked content from results (by ID and title patterns)
export function filterBlockedContent<
  T extends { id: number; name?: string; title?: string },
>(items: T[]): T[] {
  return items.filter((item) => {
    // Check ID blocklist
    if (BLOCKED_ANIME_IDS.has(item.id)) {
      return false;
    }

    // Check title patterns
    const itemTitle = item.name || item.title || "";
    for (const pattern of BLOCKED_TITLE_PATTERNS) {
      if (pattern.test(itemTitle)) {
        return false;
      }
    }

    return true;
  });
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
    minVotes = 10,
  } = options;

  // For "highest rated", require more votes to filter out niche content
  // with inflated ratings, but keep thresholds low to show more movies
  const isHighestRated = sortBy === "vote_average.desc";
  const isAnime = genre === 16 && language === "ja";

  let actualMinVotes = minVotes;
  if (isHighestRated) {
    // For anime: min 50 votes, for others: min 500 votes
    actualMinVotes = isAnime
      ? Math.max(minVotes, 50)
      : Math.max(minVotes, 500);
  }

  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
  };

  // Only add vote_count.gte if it's greater than 0
  if (actualMinVotes > 0) {
    params["vote_count.gte"] = actualMinVotes;
  }

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
    minVotes = 10,
  } = options;

  // For "highest rated", require more votes to filter out niche content
  // with inflated ratings, but keep thresholds low to show more content
  const isHighestRated = sortBy === "vote_average.desc";
  const isAnime = genre === 16 && language === "ja";

  let actualMinVotes = minVotes;
  if (isHighestRated) {
    // For anime: min 50 votes, for others: min 250 votes
    actualMinVotes = isAnime
      ? Math.max(minVotes, 50)
      : Math.max(minVotes, 250);
  }

  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: sortBy,
    include_adult: false,
  };

  // Only add vote_count.gte if it's greater than 0
  if (actualMinVotes > 0) {
    params["vote_count.gte"] = actualMinVotes;
  }

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
  // TMDB returns both cast and crew in combined_credits
  const data = await fetchTMDB<{
    id: number;
    cast: PersonCredits["cast"];
    crew: PersonCredits["crew"];
  }>(`/person/${id}/combined_credits`);
  
  return {
    id: data.id,
    cast: data.cast || [],
    crew: data.crew || [],
  };
}
