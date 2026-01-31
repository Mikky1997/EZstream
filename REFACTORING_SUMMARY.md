# Browse Pages Refactoring Summary

## Overview
Refactored the three browse pages (Movies, TV Shows, Anime) to eliminate code duplication and improve maintainability using reusable components and TanStack Query.

---

## Problems Identified

### 1. Massive Code Duplication (~90% identical code)
The three browse pages had nearly identical implementations:
- `movies/page.tsx` - 406 lines
- `tv/page.tsx` - 400 lines  
- `anime/page.tsx` - 320 lines

Each page duplicated:
- 8+ useState calls for the same state management
- Identical IntersectionObserver infinite scroll logic
- Same rating sort algorithm (fetch 5 pages, dedupe, sort by IMDB)
- Same filter UI patterns (genre pills, language pills, dropdowns)
- Same loading/empty state rendering
- Same API fetching logic

### 2. No Error Handling
- API failures logged to console only
- No user-facing error UI
- No retry mechanism

### 3. No Caching
- Every navigation refetched all data
- No request deduplication

### 4. Hardcoded Constants
- Genre lists duplicated in each file
- Sort options duplicated
- Country options duplicated

### 5. Poor Type Safety
- Using `as` casts instead of proper type guards
- Inconsistent typing across files

---

## Solutions Implemented

### 1. Centralized Constants (`lib/constants/browse.ts`)
```
- MOVIE_GENRES, TV_GENRES
- MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS
- COUNTRY_OPTIONS
- generateYearOptions() helper
- Pagination constants
```

### 2. TanStack Query Hook (`app/hooks/useBrowseMedia.ts`)
- Uses `useInfiniteQuery` for pagination
- Automatic caching (navigate away and back = instant load)
- Built-in loading/error states
- Request deduplication
- Special handling for rating sort (fetches multiple pages, sorts client-side)

### 3. Infinite Scroll Hook (`app/hooks/useInfiniteScroll.ts`)
- Single reusable IntersectionObserver implementation
- Configurable threshold and root margin
- Clean callback ref pattern to avoid stale closures

### 4. Reusable UI Components (`app/components/browse/`)
| Component | Purpose |
|-----------|---------|
| `FilterPills` | Genre and language filter buttons |
| `FilterDropdown` | Year and sort select dropdowns |
| `MediaGrid` | Responsive grid layout for media cards |
| `LoadingSpinner` | Full-page and inline loading states |
| `EmptyState` | Consistent "no results" messaging |
| `ErrorState` | Error display with retry button |
| `BrowsePageLayout` | Composed component wiring everything together |

### 5. Type Improvements (`types/index.ts`)
```typescript
FilterOption<T>     // Generic filter option
GenreOption         // Genre with id/name
SortOption          // Sort option with value/label
BrowseOptions       // API request options
BrowseResponse      // API response type
BrowseError         // Custom error class
MediaType           // "movie" | "tv" union
MediaItem           // Movie | TVShow union
```

---

## Results

### Lines of Code Comparison

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `movies/page.tsx` | 406 | 24 | **94%** |
| `tv/page.tsx` | 400 | 24 | **94%** |
| `anime/page.tsx` | 320 | 175 | **45%** |
| **Total in pages** | **1,126** | **223** | **80%** |

### New Reusable Code Created
| File | Lines | Purpose |
|------|-------|---------|
| `lib/constants/browse.ts` | 115 | Centralized configuration |
| `lib/api/browse.ts` | 83 | API helpers |
| `app/hooks/useBrowseMedia.ts` | 102 | TanStack Query hook |
| `app/hooks/useInfiniteScroll.ts` | 68 | Infinite scroll hook |
| `app/components/browse/*` | 420 | 7 UI components |
| `types/index.ts` additions | 55 | Type definitions |
| **Total new code** | **843** | Reusable across app |

### Net Change
- **Before:** 1,126 lines of duplicated code
- **After:** 223 lines in pages + 843 lines of reusable code
- **Total:** 1,066 lines (saved 60 lines net, but eliminated duplication)

---

## Key Improvements

### 1. DRY Principle
- Zero code duplication across browse pages
- Single source of truth for all browse logic

### 2. Better User Experience
- TanStack Query caching = instant back navigation
- Error states with retry buttons
- Consistent loading indicators

### 3. Maintainability
- Add new browse page with ~25 lines of config
- Fix bugs in one place, fixed everywhere
- Easy to add new filters or sort options

### 4. Type Safety
- Full TypeScript types throughout
- No more `as` casts in page components
- Generic components with proper inference

### 5. Testability
- Hooks can be unit tested in isolation
- Components are pure and predictable
- API layer is separated from UI

---

## Architecture Diagram

```
Browse Pages (24 lines each)
    │
    └── BrowsePageLayout
            │
            ├── useBrowseMedia (TanStack Query)
            │       │
            │       ├── useInfiniteQuery (normal pagination)
            │       └── useQuery (rating sort)
            │
            ├── useInfiniteScroll (IntersectionObserver)
            │
            └── UI Components
                    ├── FilterPills
                    ├── FilterDropdown
                    ├── MediaGrid
                    ├── LoadingSpinner
                    ├── EmptyState
                    └── ErrorState
```

---

## Files Changed

**Modified:**
- `app/browse/movies/page.tsx` (406 → 24 lines)
- `app/browse/tv/page.tsx` (400 → 24 lines)
- `app/browse/anime/page.tsx` (320 → 175 lines)
- `types/index.ts` (+55 lines for browse types)

**Created:**
- `lib/constants/browse.ts`
- `lib/api/browse.ts`
- `app/hooks/useBrowseMedia.ts`
- `app/hooks/useInfiniteScroll.ts`
- `app/components/browse/BrowsePageLayout.tsx`
- `app/components/browse/FilterPills.tsx`
- `app/components/browse/FilterDropdown.tsx`
- `app/components/browse/MediaGrid.tsx`
- `app/components/browse/LoadingSpinner.tsx`
- `app/components/browse/EmptyState.tsx`
- `app/components/browse/ErrorState.tsx`
- `app/components/browse/index.ts`

---

## Commit
```
ee3ccf2 - Refactor browse pages with reusable components and TanStack Query
16 files changed, 1,280 insertions(+), 1,017 deletions(-)
```
