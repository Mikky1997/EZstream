"use client";

import { memo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Person } from "@/types";

interface PersonCardProps {
  person: Person;
}

const PersonCard = memo(function PersonCard({ person }: PersonCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const profilePath = person.profile_path
    ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
    : null;

  // Get top known for title
  const knownFor = person.known_for?.slice(0, 2).map((item) => {
    return "title" in item ? item.title : item.name;
  });

  return (
    <div className="movie-card group relative">
      <Link href={`/person/${person.id}`} prefetch={false}>
        <div className="card-scale cursor-pointer">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
            {profilePath && !hasError ? (
              <>
                <div
                  className={`absolute inset-0 bg-gray-800 ${!isLoaded ? "animate-shimmer" : "hidden"}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                  </div>
                </div>
                <Image
                  src={profilePath}
                  alt={person.name}
                  fill
                  className={`object-cover transition-opacity duration-200 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 185px"
                  loading="lazy"
                  onLoad={() => setIsLoaded(true)}
                  onError={() => setHasError(true)}
                  unoptimized
                />
              </>
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
            {/* Person badge */}
            <div className="absolute top-2 left-2 z-10">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-600/90 text-white">
                ACTOR
              </span>
            </div>
            {/* Gradient overlay */}
            <div className="card-overlay absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {person.known_for_department && (
                  <span className="text-gray-300 text-xs">
                    {person.known_for_department}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="px-1">
            <h3 className="text-white text-sm font-medium line-clamp-1">
              {person.name}
            </h3>
            {knownFor && knownFor.length > 0 && (
              <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                {knownFor.join(", ")}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
});

export default PersonCard;
