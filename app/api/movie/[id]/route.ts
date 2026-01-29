import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getIMDbId } from "@/lib/tmdb";
import { getOMDbRatings } from "@/lib/omdb";
import { safeParseInt } from "@/lib/security";

// Cache movie details for 1 hour (movie info doesn't change often)
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = safeParseInt(params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (id === 0) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
    }

    const [details, imdbId] = await Promise.all([
      getMovieDetails(id),
      getIMDbId("movie", id),
    ]);

    // Fetch IMDB ratings from OMDb if we have an IMDB ID
    let omdbRatings = null;
    if (imdbId) {
      omdbRatings = await getOMDbRatings(imdbId);
    }

    return NextResponse.json(
      {
        ...details,
        imdbId,
        imdbRating: omdbRatings?.imdbRating || null,
        imdbVotes: omdbRatings?.imdbVotes || null,
        metascore: omdbRatings?.metascore || null,
        rottenTomatoes: omdbRatings?.rottenTomatoes || null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("Movie API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
