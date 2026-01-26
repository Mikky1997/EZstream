import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails, getIMDbId } from '@/lib/tmdb';

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

    return NextResponse.json({ ...details, imdbId });
  } catch (error) {
    console.error('Movie API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}
