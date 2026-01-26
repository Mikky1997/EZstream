import { NextResponse } from 'next/server';
import { discoverTVWithFilters } from '@/lib/tmdb';

// Cache browse results for 5 minutes
export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const genre = searchParams.get('genre');
  const sortBy = searchParams.get('sort_by') || 'popularity.desc';
  const year = searchParams.get('year');
  const language = searchParams.get('language');
  // Higher minVotes = more popular shows = more likely to be available on streaming sources
  const minVotes = parseInt(searchParams.get('min_votes') || '50');

  try {
    const data = await discoverTVWithFilters({
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
    console.error('Browse TV error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV shows' },
      { status: 500 }
    );
  }
}
