import { NextRequest, NextResponse } from 'next/server';
import { getTVShowDetails, getIMDbId } from '@/lib/tmdb';

// Cache TV show details for 1 hour
export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const [details, imdbId] = await Promise.all([
      getTVShowDetails(id),
      getIMDbId('tv', id),
    ]);

    return NextResponse.json({ ...details, imdbId }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('TV API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV show details' },
      { status: 500 }
    );
  }
}
