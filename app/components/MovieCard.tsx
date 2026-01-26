'use client';

import { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWatchlistContext } from '@/app/contexts/WatchlistContext';
import type { Movie, TVShow } from '@/types';

interface MovieCardProps {
  item: Movie | TVShow;
  mediaType: 'movie' | 'tv';
}

// Tiny blurred placeholder - instant display
const shimmerPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTg1IiBoZWlnaHQ9IjI3OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYyOTM3Ii8+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFmMjkzNyIvPjxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMzc0MTUxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMWYyOTM3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+';

const MovieCard = memo(function MovieCard({ item, mediaType }: MovieCardProps) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  // Use w154 for even faster thumbnails
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
    : null;

  const inWatchlist = isInWatchlist(mediaType, item.id);

  const handleWatchlistClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    if (inWatchlist) {
      await removeFromWatchlist(mediaType, item.id);
    } else {
      await addToWatchlist(mediaType, item.id, title, item.poster_path);
    }
  }, [user, inWatchlist, mediaType, item.id, title, item.poster_path, removeFromWatchlist, addToWatchlist]);

  return (
    <div className="group relative">
      <Link href={`/watch/${mediaType}/${item.id}`} prefetch={false}>
        <div className="cursor-pointer transform transition-transform duration-300 hover:scale-105 will-change-transform">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
            {posterPath && !hasError ? (
              <>
                {/* Animated shimmer placeholder - shows instantly */}
                <div className={`absolute inset-0 bg-gray-800 ${!isLoaded ? 'animate-shimmer' : 'hidden'}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                </div>
                <Image
                  src={posterPath}
                  alt={title}
                  fill
                  className={`object-cover group-hover:brightness-110 transition-opacity duration-200 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  sizes="154px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={shimmerPlaceholder}
                  onLoad={() => setIsLoaded(true)}
                  onError={() => setHasError(true)}
                  unoptimized
                />
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-semibold line-clamp-2">
                  {title}
                </p>
                {releaseDate && (
                  <p className="text-gray-300 text-xs mt-1">
                    {new Date(releaseDate).getFullYear()}
                  </p>
                )}
                {item.vote_average > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-white text-xs">
                      {item.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-1">
            <h3 className="text-white text-sm font-medium line-clamp-1 group-hover:text-blue-400 transition-colors">
              {title}
            </h3>
            {releaseDate && (
              <p className="text-gray-400 text-xs mt-1">
                {new Date(releaseDate).getFullYear()}
              </p>
            )}
          </div>
        </div>
      </Link>
      
      {/* Add to Watchlist button - only show for logged in users */}
      {user && (
        <button
          onClick={handleWatchlistClick}
          className={`absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
            inWatchlist 
              ? 'bg-blue-600 hover:bg-red-600' 
              : 'bg-black/70 hover:bg-blue-600'
          }`}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
});

export default MovieCard;
