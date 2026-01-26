import { NextRequest, NextResponse } from 'next/server';
import { getTrendingMovies, getTrendingTV } from '@/lib/tmdb';

// Cache trending results for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'movie';
  const page = searchParams.get('page') || '1';

  try {
    const results = type === 'movie' 
      ? await getTrendingMovies(parseInt(page))
      : await getTrendingTV(parseInt(page));
    
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending content' },
      { status: 500 }
    );
  }
}
