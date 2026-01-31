"use client";

import { BrowsePageLayout } from "@/app/components/browse";
import {
  ANIME_GENRES,
  ANIME_SORT_OPTIONS,
  TV_YEAR_OPTIONS,
} from "@/lib/constants/browse";

export default function BrowseAnime() {
  return (
    <BrowsePageLayout
      mediaType="tv"
      genres={ANIME_GENRES}
      sortOptions={ANIME_SORT_OPTIONS}
      yearOptions={TV_YEAR_OPTIONS}
      searchPlaceholder="Search anime..."
      searchFilterType="anime"
      mediaLabel="anime"
      animeMode
    />
  );
}
