import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, filterBlockedContent } from '@/lib/tmdb';
import { safeParseInt, sanitizeString } from '@/lib/security';
import {
  SEARCH_CACHE_SECONDS,
  SEARCH_SWR_SECONDS,
  MAX_SEARCH_QUERY_LENGTH,
  SEARCH_MIN_RESULTS_THRESHOLD,
  SEARCH_MAX_RESULTS,
  SEARCH_ADDITIONAL_PAGES,
  MIN_PAGE,
  MAX_PAGE,
} from '@/lib/constants';

// Cache search results for 2 minutes
export const revalidate = SEARCH_CACHE_SECONDS;

/** Cache-Control header for search responses */
const SEARCH_CACHE_HEADER = `public, s-maxage=${SEARCH_CACHE_SECONDS}, stale-while-revalidate=${SEARCH_SWR_SECONDS}`;

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
  const sanitizedQuery = sanitizeString(query, MAX_SEARCH_QUERY_LENGTH);
  const validatedPage = safeParseInt(page, 1, MIN_PAGE, MAX_PAGE);

  try {
    // TMDB search is already fuzzy - it uses partial matching
    // But we can improve by searching multiple pages and combining results
    const results = await searchMovies(sanitizedQuery, validatedPage);

    // If first page has few results, try to get more from additional pages
    if (results.results.length < SEARCH_MIN_RESULTS_THRESHOLD && results.total_pages > 1) {
      const additionalPages = await Promise.all(
        SEARCH_ADDITIONAL_PAGES.map((pageNum) => searchMovies(sanitizedQuery, pageNum))
      );

      // Combine results and remove duplicates
      const allResults = [
        ...results.results,
        ...additionalPages.flatMap((page) => page.results),
      ];

      const uniqueResults = allResults.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      // Filter out blocked adult content
      const filteredResults = filterBlockedContent(uniqueResults);

      return NextResponse.json({
        ...results,
        results: filteredResults.slice(0, SEARCH_MAX_RESULTS),
      }, {
        headers: { 'Cache-Control': SEARCH_CACHE_HEADER },
      });
    }

    // Filter out blocked adult content
    const filteredResults = filterBlockedContent(results.results || []);

    return NextResponse.json({
      ...results,
      results: filteredResults,
    }, {
      headers: { 'Cache-Control': SEARCH_CACHE_HEADER },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
