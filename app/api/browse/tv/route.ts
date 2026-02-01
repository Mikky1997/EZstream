import { discoverTVWithFilters } from '@/lib/tmdb';
import { processBrowseRequest } from '@/lib/browse-utils';
import { BROWSE_CACHE_SECONDS } from '@/lib/constants';

// Cache browse results for 5 minutes
export const revalidate = BROWSE_CACHE_SECONDS;

export async function GET(request: Request) {
  return processBrowseRequest({
    request,
    mediaType: 'tv',
    fetchData: (params) =>
      discoverTVWithFilters({
        page: params.page,
        genre: params.genre,
        sortBy: params.sortBy,
        year: params.year,
        language: params.language,
        minVotes: params.minVotes,
      }),
    errorPrefix: 'Browse TV',
  });
}
