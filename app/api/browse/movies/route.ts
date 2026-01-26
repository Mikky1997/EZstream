import { NextResponse } from 'next/server';
import { discoverMoviesWithFilters } from '@/lib/tmdb';

// Cache browse results for 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const genre = searchParams.get('genre');
  const sortBy = searchParams.get('sort_by') || 'popularity.desc';
  const year = searchParams.get('year');
  const language = searchParams.get('language');
  // Higher minVotes = more popular movies = more likely to be available on streaming sources
  // Default to 100 for better availability
  const minVotes = parseInt(searchParams.get('min_votes') || '100');

  try {
    const data = await discoverMoviesWithFilters({
      page,
      genre: genre ? parseInt(genre) : undefined,
      sortBy,
      year: year ? parseInt(year) : undefined,
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
