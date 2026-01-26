'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Movie, TVShow } from '@/types';

interface MovieCardProps {
  item: Movie | TVShow;
  mediaType: 'movie' | 'tv';
}

export default function MovieCard({ item, mediaType }: MovieCardProps) {
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
  const posterPath = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;

  return (
    <Link href={`/watch/${mediaType}/${item.id}`}>
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
          {posterPath ? (
            <Image
              src={posterPath}
              alt={title}
              fill
              className="object-cover group-hover:brightness-110 transition-all"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
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
  );
}
