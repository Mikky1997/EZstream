# EZstream - Agent Guidelines

> **Last Updated:** January 2025 
> **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, SQLite (better-sqlite3)

---

## 🎯 Project Overview

EZstream is a streaming platform that aggregates video content from various embed sources. It uses:
- **TMDB API** for movie/TV metadata
- **OMDb API** for IMDb ratings
- **Multiple video sources** (VidSrc.cc, VidSrc.me, Embed.su, etc.)
- **SQLite** for user data (watch history, watchlist, episodes)

---

## 📁 Project Structure

```
app/
├── api/              # API routes (Route Handlers)
├── browse/           # Browse pages (movies, tv, anime)
├── components/       # React components
│   ├── browse/       # Browse-specific components
│   └── shared/       # Shared/reusable components
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── login/            # Auth page
├── person/[id]/      # Person/actor detail pages
├── providers/        # React Query provider
├── watch/[type]/[id]/# Watch page (main video player)
├── globals.css       # Global styles + Tailwind
├── layout.tsx        # Root layout
└── page.tsx          # Home page

lib/
├── api/              # API helpers
├── constants/        # Constants (browse.ts, app.ts)
├── auth.ts           # Authentication utilities
├── db.ts             # Database connection & queries
├── tmdb.ts           # TMDB API integration
├── vidsrc.ts         # Video source URLs
├── omdb.ts           # OMDb API integration
├── security.ts       # Input validation & rate limiting
└── api-helpers.ts    # API route helpers

types/
└── index.ts          # TypeScript type definitions

scripts/
├── seed-users.ts     # Create predefined users
└── backup-db.sh      # Database backup script
```

---

## 🎨 Coding Standards

### TypeScript
- **Strict mode enabled** - no implicit any
- Use explicit return types for exported functions
- Prefer interfaces over type aliases for objects
- Use `as const` for constant arrays/objects

### Components
- Use functional components with hooks
- Name files with PascalCase (`TVShowControls.tsx`)
- Export default for page components, named exports for reusable components
- Use `memo()` for expensive renders

### Styling
- **Tailwind CSS only** - no CSS modules
- Use custom CSS variables for theming (see `globals.css`)
- Mobile-first responsive design
- Consistent spacing (multiples of 4px)

### Imports Order
```typescript
// 1. React/Next
import { useState } from 'react';
import { useParams } from 'next/navigation';

// 2. Third-party
import { useQuery } from '@tanstack/react-query';

// 3. Internal components
import VideoPlayer from '@/app/components/VideoPlayer';

// 4. Internal hooks/utils
import { useAuth } from '@/app/contexts/AuthContext';
import { getAllEmbedUrls } from '@/lib/vidsrc';

// 5. Types
import type { Movie, TVShow } from '@/types';
```

---

## 🔧 Common Patterns

### Database Queries
All database operations use prepared statements from `lib/db.ts`:

```typescript
import { historyQueries, watchlistQueries } from '@/lib/db';

// Fetch
const user = userQueries.findByUsername.get(username);

// Insert/Update (use .run for mutations)
historyQueries.upsert.run(userId, mediaType, mediaId, ...);
```

### API Routes
Standard structure from `lib/api-helpers.ts`:

```typescript
import { requireAuth, isAuthError, handleError } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    
    // ... handler logic
    
  } catch (error) {
    return handleError(error, "Context", "User-friendly message");
  }
}
```

### Data Fetching with React Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['media', type, id],
  queryFn: () => fetchMediaContent(type, id),
  staleTime: MEDIA_STALE_TIME, // Use constant
  retry: 2,
});
```

### Form Handling
Always validate inputs using `lib/security.ts`:

```typescript
import { validateUsername, validatePassword, sanitizeString } from '@/lib/security';

if (!validateUsername(username)) {
  return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
}
```

---

## ⚠️ Critical Implementation Details

### Video Sources
- Sources are defined in `lib/vidsrc.ts` with priority ordering
- User's preferred source is saved in `localStorage` key: `preferred_video_source`
- Auto-fallback happens if preferred source fails

### Watch History / Continue Watching
- Saved to `watch_history` table via `/api/user/history`
- **Important:** The 90% watched filter was removed - all items show in Continue Watching
- Only removed when:
  - User clicks "Mark as Watched" for movies
  - User watches final episode of final season for TV shows

### Episode Tracking
- Watched episodes stored in `watch_history` with `season` and `episode` columns
- Auto-marked as watched when user starts playing (streaming source loads)
- Season checkbox shows green when ALL episodes in that season are watched

### Rate Limiting
- In-memory rate limiting (resets on server restart)
- Login: 10 attempts per IP per 15min, 10 per username per hour
- Uses `lib/security.ts` - `checkRateLimit()` and `checkLoginRateLimit()`

### Content Filtering
- Adult anime blocklist in `lib/tmdb.ts` (`BLOCKED_ANIME_IDS`)
- Uses both ID blocklist and title pattern matching

---

## 🧪 Testing Guidelines

- **No tests currently exist** - this is a known gap
- When adding tests, use Vitest + React Testing Library
- Test critical paths: auth, API routes, video source switching

---

## 🚀 Deployment

Server deployment path: `/var/www/mikkystream`

```bash
cd /var/www/mikkystream
git pull
npm ci
npm run build
pm2 restart mikkystream --update-env
```

Environment variables in `.env.local` on server:
- `TMDB_API_KEY`
- `OMDB_API_KEY`
- `JWT_SECRET`
- `DATABASE_PATH` (optional, defaults to `./data/mikkystream.db`)

---

## 📋 Common Tasks

### Add a new video source
1. Add to `VIDEO_SOURCES_ORDERED` in `lib/vidsrc.ts`
2. Update priority maps (`ANIME_SOURCE_PRIORITY`, etc.)
3. Test with different content types

### Add a new user
Run on server:
```bash
npx tsx scripts/seed-users.ts
```

Or manually insert with bcrypt hash:
```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('password',10).then(console.log)"
```

### Database schema changes
1. Edit schema in `lib/db.ts` (CREATE TABLE IF NOT EXISTS)
2. For migrations, use `ALTER TABLE` or create migration script
3. Backup first: `sqlite3 data/mikkystream.db ".backup data/backup.db"`

---

## ❌ Things to Avoid

1. **Don't use raw SQL** outside of `lib/db.ts` - always use query helpers
2. **Don't store plaintext passwords** - always bcrypt hash
3. **Don't trust user input** - always validate/sanitize
4. **Don't add console.log** in production code (use error logging instead)
5. **Don't modify `tsconfig.json`** without testing build
6. **Don't change database schema** without backup

---

## 🔗 Useful References

- TMDB API docs: https://developers.themoviedb.org/3
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
