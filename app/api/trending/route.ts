import { NextRequest, NextResponse } from 'next/server';
import { getTrendingMovies, getTrendingTV } from '@/lib/tmdb';
import { safeParseInt } from '@/lib/security';

// Cache trending results for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'movie';
  const page = searchParams.get('page') || '1';

  // Validate type
  if (type !== 'movie' && type !== 'tv') {
    return NextResponse.json(
      { error: 'Invalid type. Must be "movie" or "tv"' },
      { status: 400 }
    );
  }

  try {
    const validatedPage = safeParseInt(page, 1, 1, 1000);
    const results = type === 'movie' 
      ? await getTrendingMovies(validatedPage)
      : await getTrendingTV(validatedPage);
    
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
