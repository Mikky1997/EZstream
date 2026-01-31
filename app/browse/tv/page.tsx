"use client";

import { BrowsePageLayout } from "@/app/components/browse";
import {
  TV_GENRES,
  TV_SORT_OPTIONS,
  TV_YEAR_OPTIONS,
} from "@/lib/constants/browse";

export default function BrowseTV() {
  return (
    <BrowsePageLayout
      mediaType="tv"
      genres={TV_GENRES}
      sortOptions={TV_SORT_OPTIONS}
      yearOptions={TV_YEAR_OPTIONS}
      searchPlaceholder="Search TV shows..."
      searchFilterType="tv"
      mediaLabel="TV shows"
      showCountryFilter
    />
  );
}
