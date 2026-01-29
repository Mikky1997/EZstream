import { NextResponse } from "next/server";
import { discoverTVWithFilters, getIMDbId } from "@/lib/tmdb";
import { getOMDbRatings } from "@/lib/omdb";
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
  const minVotes = safeParseInt(searchParams.get("min_votes"), 50, 1, 10000);

  try {
    const data = await discoverTVWithFilters({
      page,
      genre: genre ? safeParseInt(genre, undefined, 1, 100000) : undefined,
      sortBy,
      year: year ? safeParseInt(year, undefined, 1900, 2100) : undefined,
      language: language || undefined,
      minVotes,
    });

    // If sorting by highest rated, fetch IMDB ratings and re-sort
    if (sortBy === "vote_average.desc" && data.results?.length > 0) {
      // Fetch IMDB ratings for all shows in parallel (uses cache when available)
      const showsWithImdb = await Promise.all(
        data.results.map(async (show) => {
          try {
            const imdbId = await getIMDbId("tv", show.id);
            if (imdbId) {
              const ratings = await getOMDbRatings(imdbId);
              return {
                ...show,
                imdbRating: ratings?.imdbRating
                  ? parseFloat(ratings.imdbRating)
                  : null,
              };
            }
          } catch {
            // Ignore errors, fall back to TMDB rating
          }
          return { ...show, imdbRating: null };
        }),
      );

      // Sort by IMDB rating (descending), fall back to TMDB rating if no IMDB
      showsWithImdb.sort((a, b) => {
        const ratingA = a.imdbRating ?? a.vote_average ?? 0;
        const ratingB = b.imdbRating ?? b.vote_average ?? 0;
        return ratingB - ratingA;
      });

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
