import { NextRequest, NextResponse } from 'next/server';
import { getTVShowDetails, getIMDbId } from '@/lib/tmdb';

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

    return NextResponse.json({ ...details, imdbId });
  } catch (error) {
    console.error('TV API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TV show details' },
      { status: 500 }
    );
  }
}
