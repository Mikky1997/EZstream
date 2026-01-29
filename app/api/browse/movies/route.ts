import { NextResponse } from "next/server";
import { discoverMoviesWithFilters, getIMDbId } from "@/lib/tmdb";
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
  const minVotes = safeParseInt(searchParams.get("min_votes"), 100, 1, 10000);

  try {
    const data = await discoverMoviesWithFilters({
      page,
      genre: genre ? safeParseInt(genre, undefined, 1, 100000) : undefined,
      sortBy,
      year: year ? safeParseInt(year, undefined, 1900, 2100) : undefined,
      language: language || undefined,
      minVotes,
    });

    // Always fetch IMDB ratings for all results (uses 24h cache)
    if (data.results?.length > 0) {
      const moviesWithImdb = await Promise.all(
        data.results.map(async (movie) => {
          try {
            const imdbId = await getIMDbId("movie", movie.id);
            if (imdbId) {
              const omdbData = await getOMDbData(imdbId);
              return {
                ...movie,
                imdbRating: omdbData?.imdbRating || null,
                imdbVotes: omdbData?.imdbVotes || null,
              };
            }
          } catch {
            // Ignore errors, fall back to TMDB rating
          }
          return { ...movie, imdbRating: null, imdbVotes: null };
        }),
      );

      // If sorting by highest rated, re-sort by IMDB rating
      if (sortBy === "vote_average.desc") {
        moviesWithImdb.sort((a, b) => {
          const ratingA = a.imdbRating ? parseFloat(a.imdbRating) : (a.vote_average ?? 0);
          const ratingB = b.imdbRating ? parseFloat(b.imdbRating) : (b.vote_average ?? 0);
          return ratingB - ratingA;
        });
      }

      return NextResponse.json(
        { ...data, results: moviesWithImdb },
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
    console.error("Browse movies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 },
    );
  }
}
