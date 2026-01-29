import { NextResponse } from "next/server";
import {
  discoverTVWithFilters,
  getIMDbId,
  filterBlockedContent,
} from "@/lib/tmdb";
import { getOMDbData } from "@/lib/omdb";
import { safeParseInt } from "@/lib/security";

// Cache browse results for 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = safeParseInt(searchParams.get("page"), 1, 1, 1000);
  const genre = searchParams.get("genre");
  const sortBy = searchParams.get("sort_by") || "popularity.desc";
  const year = searchParams.get("year");
  const language = searchParams.get("language");

  // For anime (genre 16 + Japanese), use lower min_votes (10) to get more results
  const isAnime = genre === "16" && language === "ja";
  const defaultMinVotes = isAnime ? 10 : 50;
  const minVotes = searchParams.get("min_votes")
    ? safeParseInt(searchParams.get("min_votes"), defaultMinVotes, 1, 10000)
    : defaultMinVotes;

  try {
    const data = await discoverTVWithFilters({
      page,
      genre: genre ? safeParseInt(genre, undefined, 1, 100000) : undefined,
      sortBy,
      year: year ? safeParseInt(year, undefined, 1900, 2100) : undefined,
      language: language || undefined,
      minVotes,
    });

    // Filter out blocked adult content (hentai that slips through TMDB's filter)
    const filteredResults = filterBlockedContent(data.results || []);

    // Always fetch IMDB ratings for all results (uses 24h cache)
    if (filteredResults.length > 0) {
      const showsWithImdb = await Promise.all(
        filteredResults.map(async (show) => {
          try {
            const imdbId = await getIMDbId("tv", show.id);
            if (imdbId) {
              const omdbData = await getOMDbData(imdbId);
              return {
                ...show,
                imdbRating: omdbData?.imdbRating || null,
                imdbVotes: omdbData?.imdbVotes || null,
              };
            }
          } catch {
            // Ignore errors, fall back to TMDB rating
          }
          return { ...show, imdbRating: null, imdbVotes: null };
        }),
      );

      // If sorting by highest rated, re-sort by IMDB rating
      if (sortBy === "vote_average.desc") {
        showsWithImdb.sort((a, b) => {
          const ratingA = a.imdbRating
            ? parseFloat(a.imdbRating)
            : (a.vote_average ?? 0);
          const ratingB = b.imdbRating
            ? parseFloat(b.imdbRating)
            : (b.vote_average ?? 0);
          return ratingB - ratingA;
        });
      }

      return NextResponse.json(
        { ...data, results: showsWithImdb },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Browse TV error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV shows" },
      { status: 500 },
    );
  }
}
