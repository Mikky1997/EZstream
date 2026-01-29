import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits, getIMDbId } from "@/lib/tmdb";
import { getOMDbData } from "@/lib/omdb";
import { safeParseInt } from "@/lib/security";

// Cache person details for 1 day (doesn't change often)
export const revalidate = 86400;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = safeParseInt(params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (id === 0) {
      return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
    }

    const [details, credits] = await Promise.all([
      getPersonDetails(id),
      getPersonCredits(id),
    ]);

    // Sort credits by popularity and filter out items without posters
    const sortedCast = credits.cast
      .filter((item) => item.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Fetch IMDB ratings for top 20 credits (uses cache, so this is efficient)
    const topCredits = sortedCast.slice(0, 20);
    const creditsWithImdb = await Promise.all(
      topCredits.map(async (credit) => {
        try {
          const mediaType = credit.media_type === "movie" ? "movie" : "tv";
          const imdbId = await getIMDbId(mediaType, credit.id);
          if (imdbId) {
            const omdbData = await getOMDbData(imdbId);
            return {
              ...credit,
              imdbRating: omdbData?.imdbRating || null,
              imdbVotes: omdbData?.imdbVotes || null,
            };
          }
        } catch {
          // Ignore errors
        }
        return { ...credit, imdbRating: null, imdbVotes: null };
      }),
    );

    // Combine top credits with IMDB ratings + rest without
    const allCredits = [
      ...creditsWithImdb,
      ...sortedCast.slice(20).map((c) => ({ ...c, imdbRating: null, imdbVotes: null })),
    ];

    return NextResponse.json(
      {
        ...details,
        credits: {
          cast: allCredits,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=172800",
        },
      },
    );
  } catch (error) {
    console.error("Person API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch person details" },
      { status: 500 },
    );
  }
}
