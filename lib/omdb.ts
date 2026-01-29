// OMDb API integration for fetching IMDB ratings
// API docs: https://www.omdbapi.com/

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = "https://www.omdbapi.com";

export interface OMDbRatings {
  imdbRating: string | null;
  imdbVotes: string | null;
  metascore: string | null;
  rottenTomatoes: string | null;
}

interface OMDbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Error?: string;
}

// In-memory cache to reduce API calls (OMDb has 1000/day limit on free tier)
const ratingsCache = new Map<string, { data: OMDbRatings; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch ratings from OMDb API using IMDB ID
 * Returns IMDB rating, Metascore, and Rotten Tomatoes score
 */
export async function getOMDbRatings(imdbId: string): Promise<OMDbRatings | null> {
  if (!OMDB_API_KEY) {
    console.warn("OMDB_API_KEY not configured - IMDB ratings unavailable");
    return null;
  }

  if (!imdbId || !imdbId.startsWith("tt")) {
    return null;
  }

  // Check cache first
  const cached = ratingsCache.get(imdbId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
    
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

    const ratings: OMDbRatings = {
      imdbRating: data.imdbRating !== "N/A" ? data.imdbRating || null : null,
      imdbVotes: data.imdbVotes !== "N/A" ? data.imdbVotes || null : null,
      metascore: data.Metascore !== "N/A" ? data.Metascore || null : null,
      rottenTomatoes: rtRating !== "N/A" ? rtRating || null : null,
    };

    // Cache the result
    ratingsCache.set(imdbId, { data: ratings, timestamp: Date.now() });

    return ratings;
  } catch (error) {
    console.error("OMDb API fetch error:", error);
    return null;
  }
}

/**
 * Clear expired entries from cache (call periodically if needed)
 */
export function cleanRatingsCache(): void {
  const now = Date.now();
  for (const [key, value] of ratingsCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      ratingsCache.delete(key);
    }
  }
}
