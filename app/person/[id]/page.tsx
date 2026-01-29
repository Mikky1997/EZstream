"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import MovieCard from "@/app/components/MovieCard";
import type { Person, CastCredit, Movie, TVShow } from "@/types";

interface PersonWithCredits extends Person {
  credits: {
    cast: CastCredit[];
  };
}

export default function PersonPage() {
  const params = useParams();
  const id = params.id as string;

  const [person, setPerson] = useState<PersonWithCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    async function loadPerson() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/person/${id}`);
        if (!response.ok) {
          throw new Error("Failed to load person");
        }
        const data = await response.json();
        setPerson(data);
      } catch (err) {
        setError("Failed to load person details. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadPerson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">
            {error || "Person not found"}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const profilePath = person.profile_path
    ? `https://image.tmdb.org/t/p/w342${person.profile_path}`
    : null;

  const birthYear = person.birthday
    ? new Date(person.birthday).getFullYear()
    : null;
  const deathYear = person.deathday
    ? new Date(person.deathday).getFullYear()
    : null;

  // Filter and prepare credits for display
  const filteredCredits = person.credits.cast.filter((credit) => {
    if (filter === "all") return true;
    return credit.media_type === filter;
  });

  // Convert credits to Movie/TVShow format for MovieCard
  const creditsAsMedia = filteredCredits.map((credit) => {
    if (credit.media_type === "movie") {
      return {
        id: credit.id,
        title: credit.title || "",
        overview: "",
        poster_path: credit.poster_path,
        backdrop_path: null,
        release_date: credit.release_date || "",
        vote_average: credit.vote_average || 0,
        media_type: "movie" as const,
      } as Movie;
    } else {
      return {
        id: credit.id,
        name: credit.name || "",
        overview: "",
        poster_path: credit.poster_path,
        backdrop_path: null,
        first_air_date: credit.first_air_date || "",
        vote_average: credit.vote_average || 0,
        media_type: "tv" as const,
      } as TVShow;
    }
  });

  const movieCount = person.credits.cast.filter(
    (c) => c.media_type === "movie",
  ).length;
  const tvCount = person.credits.cast.filter(
    (c) => c.media_type === "tv",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Person Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Profile Image */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 h-72 md:w-64 md:h-96 rounded-xl overflow-hidden bg-gray-800">
              {profilePath ? (
                <Image
                  src={profilePath}
                  alt={person.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Person Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {person.name}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400 mb-4">
              {person.known_for_department && (
                <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full">
                  {person.known_for_department}
                </span>
              )}
              {birthYear && (
                <span>
                  {deathYear
                    ? `${birthYear} - ${deathYear}`
                    : `Born ${birthYear}`}
                </span>
              )}
              {person.place_of_birth && <span>{person.place_of_birth}</span>}
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {movieCount}
                </div>
                <div className="text-xs text-gray-400">Movies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{tvCount}</div>
                <div className="text-xs text-gray-400">TV Shows</div>
              </div>
            </div>

            {/* Biography */}
            {person.biography && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Biography
                </h2>
                <p
                  className={`text-gray-400 text-sm leading-relaxed ${!showFullBio ? "line-clamp-4" : ""}`}
                >
                  {person.biography}
                </p>
                {person.biography.length > 300 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                  >
                    {showFullBio ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filmography */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Filmography</h2>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                All ({person.credits.cast.length})
              </button>
              <button
                onClick={() => setFilter("movie")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "movie"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                Movies ({movieCount})
              </button>
              <button
                onClick={() => setFilter("tv")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "tv"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                TV ({tvCount})
              </button>
            </div>
          </div>

          {/* Credits Grid */}
          {creditsAsMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {creditsAsMedia.map((item, index) => (
                <MovieCard
                  key={`${item.media_type}-${item.id}-${index}`}
                  item={item}
                  mediaType={item.media_type || "movie"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No credits found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
