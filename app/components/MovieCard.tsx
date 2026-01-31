'use client';

import { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWatchlistContext } from '@/app/contexts/WatchlistContext';
import { useToast } from '@/app/contexts/ToastContext';
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
  const { showToast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
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
    
    if (!user || isPending) return;
    
    setIsPending(true);
    try {
      if (inWatchlist) {
        const success = await removeFromWatchlist(mediaType, item.id);
        if (success) {
          showToast('Removed from watchlist', 'success');
        } else {
          showToast('Failed to remove from watchlist', 'error');
        }
      } else {
        const success = await addToWatchlist(mediaType, item.id, title, item.poster_path);
        if (success) {
          showToast('Added to watchlist', 'success');
        } else {
          showToast('Failed to add to watchlist', 'error');
        }
      }
    } catch {
      showToast('Failed to update watchlist', 'error');
    } finally {
      setIsPending(false);
    }
  }, [user, isPending, inWatchlist, mediaType, item.id, title, item.poster_path, removeFromWatchlist, addToWatchlist, showToast]);

  return (
    <div className="movie-card group relative">
      <Link href={`/watch/${mediaType}/${item.id}`} prefetch={false}>
        {/* card-scale class handles hover on desktop only via CSS */}
        <div className="card-scale cursor-pointer">
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
                  }`}
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
            {/* Media type badge */}
            <div className="absolute top-2 left-2 z-10">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                mediaType === 'movie' 
                  ? 'bg-blue-600/90 text-white' 
                  : 'bg-purple-600/90 text-white'
              }`}>
                {mediaType === 'movie' ? 'MOVIE' : 'TV'}
              </span>
            </div>
            {/* Gradient overlay - always visible on mobile, hover on desktop */}
            <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Prefer IMDB rating if available, fallback to TMDB */}
                {(item.imdbRating || item.vote_average > 0) && (
                  <div className="flex items-center gap-1">
                    {item.imdbRating ? (
                      <>
                        <span className="text-yellow-400 text-[10px] font-bold">IMDb</span>
                        <span className="text-white text-xs font-medium">
                          {item.imdbRating}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-white text-xs font-medium">
                          {item.vote_average.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-1">
            <h3 className="text-white text-sm font-medium line-clamp-1">
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
      
      {/* Watchlist button - visible on hover (desktop) or always (mobile) */}
      {user && (
        <button
          onClick={handleWatchlistClick}
          disabled={isPending}
          className={`card-action-btn absolute top-1 right-1 md:top-2 md:right-2 w-9 h-9 md:w-8 md:h-8 rounded-full z-10 flex items-center justify-center touch-manipulation ${
            inWatchlist 
              ? 'bg-blue-600 active:bg-red-600' 
              : 'bg-black/80 active:bg-blue-600'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
          {inWatchlist ? (
            // X icon - properly centered
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Plus icon - properly centered
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
});

export default MovieCard;
