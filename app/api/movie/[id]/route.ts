import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, getIMDbId } from '@/lib/tmdb';

// Cache movie details for 1 hour (movie info doesn't change often)
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const [details, imdbId] = await Promise.all([
      getMovieDetails(id),
      getIMDbId('movie', id),
    ]);

    return NextResponse.json({ ...details, imdbId }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Movie API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}
