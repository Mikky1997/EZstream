import { NextRequest, NextResponse } from "next/server";
import { getTVShowDetails, getIMDbId } from "@/lib/tmdb";
import { getOMDbData } from "@/lib/omdb";
import { safeParseInt } from "@/lib/security";
import type { CrewMember } from "@/types";

// Cache TV show details for 1 hour
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = safeParseInt(params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (id === 0) {
      return NextResponse.json(
        { error: "Invalid TV show ID" },
        { status: 400 },
      );
    }

    const [details, imdbId] = await Promise.all([
      getTVShowDetails(id),
      getIMDbId("tv", id),
    ]);

    // Fetch IMDB data from OMDb if we have an IMDB ID
    let omdbData = null;
    if (imdbId) {
      omdbData = await getOMDbData(imdbId);
    }

    // Extract creators/directors and writers from TMDB credits (with IDs for direct linking)
    const crew = (details.credits as { cast: unknown[]; crew: CrewMember[] })?.crew || [];
    
    // For TV, directors are per-episode, so we also check for "created_by" 
    const createdBy = (details as { created_by?: { id: number; name: string; profile_path: string | null }[] }).created_by || [];
    const directors = createdBy.length > 0
      ? createdBy.map((c) => ({ id: c.id, name: c.name, job: "Creator", department: "Creator", profile_path: c.profile_path }))
      : crew
          .filter((c) => c.job === "Director" || c.job === "Executive Producer")
          .slice(0, 3)
          .map((c) => ({ id: c.id, name: c.name, job: c.job, department: c.department, profile_path: c.profile_path }));
    
    const writers = crew
      .filter((c) => c.department === "Writing" || c.job === "Writer" || c.job === "Screenplay" || c.job === "Creator")
      .reduce((acc: CrewMember[], c) => {
        // Dedupe by id
        if (!acc.find((w) => w.id === c.id)) {
          acc.push({ id: c.id, name: c.name, job: c.job, department: c.department, profile_path: c.profile_path });
        }
        return acc;
      }, [])
      .slice(0, 5); // Limit to 5 writers

    // Extract keywords as tags (TV shows use 'results' array)
    const keywordsData = (details as { keywords?: { results: { id: number; name: string }[] } }).keywords;
    const tags = keywordsData?.results
      ?.slice(0, 10)
      .map((k) => k.name.charAt(0).toUpperCase() + k.name.slice(1)) || [];

    // Extract trailer from videos (prefer official YouTube trailers)
    const videosData = (details as { videos?: { results: { key: string; site: string; type: string; official: boolean }[] } }).videos;
    const trailers = videosData?.results?.filter(
      (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
    ) || [];
    // Prefer official trailers, then any trailer
    const trailer = trailers.find((t) => t.official && t.type === "Trailer")
      || trailers.find((t) => t.type === "Trailer")
      || trailers[0];
    const trailerKey = trailer?.key || null;

    return NextResponse.json(
      {
        ...details,
        imdbId,
        // Crew with IDs (for direct linking)
        directors,
        writers,
        // Tags from TMDB keywords
        tags,
        // Trailer
        trailerKey,
        // Ratings
        imdbRating: omdbData?.imdbRating || null,
        imdbVotes: omdbData?.imdbVotes || null,
        metascore: omdbData?.metascore || null,
        rottenTomatoes: omdbData?.rottenTomatoes || null,
        // IMDB data
        imdbGenres: omdbData?.imdbGenres || null,
        director: omdbData?.director || null,  // Fallback string
        writer: omdbData?.writer || null,      // Fallback string
        imdbActors: omdbData?.actors || null,
        rated: omdbData?.rated || null,
        awards: omdbData?.awards || null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("TV API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show details" },
      { status: 500 },
    );
  }
}
