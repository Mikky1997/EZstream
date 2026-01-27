'use client';

import { memo, useCallback, useState, useEffect } from 'react';
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

// Hook to detect touch device
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Check if device supports touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(hasTouch);
  }, []);
  
  return isTouch;
}

const MovieCard = memo(function MovieCard({ item, mediaType }: MovieCardProps) {
  const { user } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistContext();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isTouch = useIsTouchDevice();
  
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  // Use w342 for good quality posters (342px wide, sharp on most screens)
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
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
        {/* Remove hover:scale on touch devices to prevent double-tap issue */}
        <div className={`cursor-pointer transform transition-transform duration-300 will-change-transform ${
          isTouch ? 'active:scale-95' : 'hover:scale-105'
        }`}>
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
                  className={`object-cover transition-opacity duration-200 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  } ${!isTouch ? 'group-hover:brightness-110' : ''}`}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 185px"
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
            {/* On touch devices, always show a subtle gradient at bottom for readability */}
            {/* On desktop, show full overlay on hover */}
            <div className={`absolute inset-0 transition-opacity ${
              isTouch 
                ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100' 
                : 'bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100'
            }`}>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* On touch, only show rating badge. On desktop, show full info on hover */}
                {isTouch ? (
                  item.vote_average > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-white text-xs font-medium">
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                  )
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="px-1">
            <h3 className={`text-white text-sm font-medium line-clamp-1 transition-colors ${
              isTouch ? 'active:text-blue-400' : 'group-hover:text-blue-400'
            }`}>
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
      
      {/* Add to Watchlist button - always visible on touch, hover on desktop */}
      {user && (
        <button
          onClick={handleWatchlistClick}
          className={`absolute top-2 right-2 p-2 rounded-full transition-opacity z-10 ${
            isTouch ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
          } ${
            inWatchlist 
              ? 'bg-blue-600 hover:bg-red-600 active:bg-red-700' 
              : 'bg-black/70 hover:bg-blue-600 active:bg-blue-700'
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
