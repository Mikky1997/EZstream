// OMDb API integration for fetching IMDB data
// API docs: https://www.omdbapi.com/

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com";

export interface OMDbData {
  // Ratings
  imdbRating: string | null;
  imdbVotes: string | null;
  metascore: string | null;
  rottenTomatoes: string | null;
  // Crew & Cast
  director: string | null;
  writer: string | null;
  actors: string | null;
  // Other
  imdbGenres: string[] | null;
  rated: string | null; // PG-13, R, etc.
  awards: string | null;
  plot: string | null;
}

interface OMDbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Rated?: string;
  Awards?: string;
  Plot?: string;
  Error?: string;
}

// In-memory cache to reduce API calls (OMDb has 1000/day limit on free tier)
const dataCache = new Map<string, { data: OMDbData; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch full data from OMDb API using IMDB ID
 * Returns ratings, genres, director, writers, actors, and more
 */
export async function getOMDbData(imdbId: string): Promise<OMDbData | null> {
  if (!OMDB_API_KEY) {
    console.warn("OMDB_API_KEY not configured - IMDB data unavailable");
    return null;
  }

  if (!imdbId || !imdbId.startsWith("tt")) {
    return null;
  }

  // Check cache first
  const cached = dataCache.get(imdbId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${OMDB_BASE_URL}/?i=${imdbId}&plot=short&apikey=${OMDB_API_KEY}`;
    
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      // Cache for 24 hours in Next.js
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      console.error(`OMDb API error: ${response.status}`);
      return null;
    }

    const data: OMDbResponse = await response.json();

    if (data.Response === "False") {
      console.warn(`OMDb lookup failed for ${imdbId}: ${data.Error}`);
      return null;
    }

    // Extract Rotten Tomatoes from Ratings array
    const rtRating = data.Ratings?.find(
      (r) => r.Source === "Rotten Tomatoes"
    )?.Value;

    // Parse genres into array
    const genres = data.Genre && data.Genre !== "N/A" 
      ? data.Genre.split(", ").map(g => g.trim())
      : null;

    const omdbData: OMDbData = {
      imdbRating: data.imdbRating !== "N/A" ? data.imdbRating || null : null,
      imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes || null : null,
      metascore: data.Metascore !== "N/A" ? data.Metascore || null : null,
      rottenTomatoes: rtRating !== "N/A" ? rtRating || null : null,
      director: data.Director !== "N/A" ? data.Director || null : null,
      writer: data.Writer !== "N/A" ? data.Writer || null : null,
      actors: data.Actors !== "N/A" ? data.Actors || null : null,
      imdbGenres: genres,
      rated: data.Rated !== "N/A" ? data.Rated || null : null,
      awards: data.Awards !== "N/A" ? data.Awards || null : null,
      plot: data.Plot !== "N/A" ? data.Plot || null : null,
    };

    // Cache the result
    dataCache.set(imdbId, { data: omdbData, timestamp: Date.now() });

    return omdbData;
  } catch (error) {
    console.error("OMDb API fetch error:", error);
    return null;
  }
}

// Legacy function for backward compatibility
export async function getOMDbRatings(imdbId: string): Promise<OMDbData | null> {
  return getOMDbData(imdbId);
}

/**
 * Clear expired entries from cache (call periodically if needed)
 */
export function cleanDataCache(): void {
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      dataCache.delete(key);
    }
  }
}
