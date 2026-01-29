import { NextResponse } from 'next/server';
import { discoverMoviesWithFilters } from '@/lib/tmdb';
import { safeParseInt } from '@/lib/security';

// Cache browse results for 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = safeParseInt(searchParams.get('page'), 1, 1, 1000);
  const genre = searchParams.get('genre');
  const sortBy = searchParams.get('sort_by') || 'popularity.desc';
  const year = searchParams.get('year');
  const language = searchParams.get('language');
  // Higher minVotes = more popular movies = more likely to be available on streaming sources
  // Default to 100 for better availability
  const minVotes = safeParseInt(searchParams.get('min_votes'), 100, 1, 10000);

  try {
    const data = await discoverMoviesWithFilters({
      page,
      genre: genre ? safeParseInt(genre, undefined, 1, 100000) : undefined,
      sortBy,
      year: year ? safeParseInt(year, undefined, 1900, 2100) : undefined,
      language: language || undefined,
      minVotes,
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Browse movies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
