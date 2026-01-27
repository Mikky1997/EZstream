import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb';
import { safeParseInt, sanitizeString } from '@/lib/security';

// Cache search results for 2 minutes
export const revalidate = 120;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  // Validate and sanitize inputs
  const sanitizedQuery = sanitizeString(query, 200);
  const validatedPage = safeParseInt(page, 1, 1, 1000);

  try {
    // TMDB search is already fuzzy - it uses partial matching
    // But we can improve by searching multiple pages and combining results
    const results = await searchMovies(sanitizedQuery, validatedPage);
    
    // If first page has few results, try to get more
    if (results.results.length < 10 && results.total_pages > 1) {
      const additionalPages = await Promise.all([
        searchMovies(sanitizedQuery, 2),
        searchMovies(sanitizedQuery, 3),
      ]);
      
      // Combine results and remove duplicates
      const allResults = [
        ...results.results,
        ...additionalPages[0].results,
        ...additionalPages[1].results,
      ];
      
      const uniqueResults = allResults.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
      
      return NextResponse.json({
        ...results,
        results: uniqueResults.slice(0, 40), // Limit to 40 results
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      });
    }
    
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
