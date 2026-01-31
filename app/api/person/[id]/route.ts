import { NextRequest, NextResponse } from "next/server";
import { getPersonDetails, getPersonCredits, getIMDbId } from "@/lib/tmdb";
import { getOMDbData } from "@/lib/omdb";
import { safeParseInt } from "@/lib/security";
import type { CastCredit, CrewCredit } from "@/types";

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

    // Filter and sort cast credits (acting roles)
    const sortedCast = credits.cast
      .filter((item) => item.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Filter and sort crew credits (directing, writing, producing, etc.)
    // Prioritize important jobs: Director, Writer, Producer
    const importantJobs = ["Director", "Writer", "Screenplay", "Producer", "Executive Producer", "Creator"];
    const sortedCrew = credits.crew
      .filter((item) => item.poster_path)
      .sort((a, b) => {
        // First by importance of job
        const aImportance = importantJobs.indexOf(a.job || "") !== -1 ? 1 : 0;
        const bImportance = importantJobs.indexOf(b.job || "") !== -1 ? 1 : 0;
        if (bImportance !== aImportance) return bImportance - aImportance;
        // Then by popularity
        return (b.popularity || 0) - (a.popularity || 0);
      });

    // Merge cast and crew, remove duplicates (same movie can appear in both)
    // Create a combined list, prioritizing cast entries but including crew-only items
    const seenIds = new Set<string>();
    const allCreditsRaw: (CastCredit | (CrewCredit & { character?: string }))[] = [];

    // Add cast first
    for (const item of sortedCast) {
      const key = `${item.media_type}-${item.id}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        allCreditsRaw.push(item);
      }
    }

    // Add crew items that aren't already in cast
    for (const item of sortedCrew) {
      const key = `${item.media_type}-${item.id}`;
      if (!seenIds.has(key)) {
        seenIds.add(key);
        // Convert crew to cast-like format with job info as character
        allCreditsRaw.push({
          ...item,
          character: item.job || "Crew", // Show job role instead of character
        });
      }
    }

    // Sort combined list by popularity
    allCreditsRaw.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    // Fetch IMDB ratings for top 20 credits (uses cache, so this is efficient)
    const topCredits = allCreditsRaw.slice(0, 20);
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
      ...allCreditsRaw.slice(20).map((c) => ({ ...c, imdbRating: null, imdbVotes: null })),
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
