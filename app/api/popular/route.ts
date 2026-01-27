import { NextRequest, NextResponse } from 'next/server';
import { getPopularMovies } from '@/lib/tmdb';
import { safeParseInt } from '@/lib/security';

// Cache popular results for 5 minutes
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';

  try {
    const validatedPage = safeParseInt(page, 1, 1, 1000);
    const results = await getPopularMovies(validatedPage);
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Popular API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular content' },
      { status: 500 }
    );
  }
}
