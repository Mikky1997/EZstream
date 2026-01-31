"use client";

import { BrowsePageLayout } from "@/app/components/browse";
import {
  MOVIE_GENRES,
  MOVIE_SORT_OPTIONS,
  MOVIE_YEAR_OPTIONS,
} from "@/lib/constants/browse";

export default function BrowseMovies() {
  return (
    <BrowsePageLayout
      title="Browse Movies"
      subtitle="Discover movies from around the world"
      mediaType="movie"
      genres={MOVIE_GENRES}
      sortOptions={MOVIE_SORT_OPTIONS}
      yearOptions={MOVIE_YEAR_OPTIONS}
      accentColor="blue"
      searchPlaceholder="Search movies..."
      searchFilterType="movie"
      mediaLabel="movies"
      showCountryFilter
    />
  );
}
