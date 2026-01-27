# MikkyStream - Technical Summary & Architecture Overview

## Executive Summary

**MikkyStream** is a modern, full-stack streaming platform that aggregates movies, TV shows, and anime from multiple third-party sources. The platform provides a Netflix-like user experience with personalized features including watch history, watchlists, and seamless content discovery.

### Key Business Value
- **User Engagement**: Personalized watch history and watchlists increase user retention
- **Content Discovery**: Intelligent mixed feed algorithm surfaces trending, popular, and anime content
- **Multi-Source Reliability**: 12+ streaming providers with automatic fallback ensure high content availability
- **Performance Optimized**: Fast load times, efficient caching, and responsive design
- **Scalable Architecture**: Built on modern, production-ready technologies

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │  Next.js App │  │   Contexts   │     │
│  │  Components  │  │    Router    │  │  (Auth, WL) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js 14 Application Server                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Routes  │  │ Middleware   │  │   Server     │     │
│  │  (REST API)  │  │  (Auth)      │  │  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SQLite DB  │    │  TMDB API    │    │  Streaming   │
│  (User Data) │    │  (Metadata)  │    │  Providers   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Context API** - State management for auth and watchlist

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **SQLite** (better-sqlite3) - Embedded database with WAL mode
- **JWT** (jose library) - Secure session management
- **bcryptjs** - Password hashing

### External Services
- **TMDB API** - Movie/TV metadata and images
- **12+ Streaming Providers** - VidSrc, MoviesAPI, 2Embed, etc.

### Infrastructure
- **PM2** - Process management
- **Nginx** - Reverse proxy and static asset serving
- **Cloudflare** (optional) - CDN and DDoS protection

---

## Core Components & Data Flow

### 1. Authentication System

**Flow:**
```
User Login → POST /api/auth/login
    ↓
Verify credentials (bcrypt)
    ↓
Create session (UUID) → Store in SQLite
    ↓
Generate JWT token (contains sessionId)
    ↓
Set HTTP-only cookie (1 year expiration)
    ↓
Return user data to client
```

**Key Files:**
- `lib/auth.ts` - Authentication logic
- `lib/db.ts` - Session storage
- `app/api/auth/login/route.ts` - Login endpoint
- `app/contexts/AuthContext.tsx` - Client-side auth state
- `middleware.ts` - Route protection

**Security Features:**
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 1-year expiration
- HTTP-only cookies prevent XSS attacks
- Session validation on every request
- Automatic cleanup of expired sessions

### 2. Content Discovery

**Home Page Feed Algorithm:**
```
1. Load 5 parallel API calls:
   - Trending Movies (page 1)
   - Trending TV (page 1)
   - Popular Movies (page 1)
   - Popular TV (page 1)
   - Anime (Japanese TV, genre 16)

2. Deduplicate by ID (Set-based)
3. Mix content (10 movies, 10 TV, 8 anime)
4. Fisher-Yates shuffle for randomization
5. Display in grid

6. Infinite Scroll:
   - Rotate through sources (trending/popular/anime)
   - Load next page when user scrolls near bottom
   - Intersection Observer API for performance
```

**Key Files:**
- `app/page.tsx` - Home page with feed logic
- `app/api/trending/route.ts` - Trending content API
- `app/api/popular/route.ts` - Popular content API
- `app/api/browse/tv/route.ts` - Browse with filters
- `lib/tmdb.ts` - TMDB API client

**Caching Strategy:**
- API responses cached for 5 minutes (browse) or 1 hour (details)
- Next.js automatic revalidation
- CDN caching via Cloudflare headers

### 3. Search System

**Two-Tier Search:**
1. **Live Search** (as you type):
   - Debounced API calls
   - Results appear instantly
   - Limited to 18 results

2. **Full Search** (on Enter):
   - Complete search results
   - All matching content

**Key Files:**
- `app/components/SearchBar.tsx` - Search UI component
- `app/api/search/route.ts` - Search endpoint
- `lib/tmdb.ts` - `searchMovies()` function

### 4. Video Streaming

**Multi-Source Architecture:**
```
User clicks "Watch"
    ↓
Fetch content details from TMDB
    ↓
Get IMDb ID (if available)
    ↓
Generate embed URLs for 12+ providers
    ↓
Try primary source (VidSrc.me)
    ↓
If fails → Auto-fallback to next source
    ↓
Embed iframe player
```

**Source Priority:**
1. **Top Tier**: VidSrc.me, MoviesAPI, VidSrc.cc
2. **Second Tier**: Embed.su, AutoEmbed, VidSrc.pro
3. **Third Tier**: SuperEmbed, 2Embed, StreamSRC

**Key Files:**
- `app/watch/[type]/[id]/page.tsx` - Watch page
- `app/components/VideoPlayer.tsx` - Player component
- `lib/vidsrc.ts` - Source URL generation
- `app/api/movie/[id]/route.ts` - Movie details
- `app/api/tv/[id]/route.ts` - TV show details

**Features:**
- Automatic source switching on failure
- Manual source selector
- Episode navigation for TV shows
- Progress tracking

### 5. User Data Management

**Watch History:**
- Tracks progress (seconds watched / total duration)
- Stores per-episode for TV shows
- "Continue Watching" shows items with >60s progress
- Auto-saves every 10 seconds while watching
- Mark as "Watched" removes from Continue Watching

**Watchlist:**
- Save movies/shows for later
- Persistent across sessions
- Quick access from home page

**Database Schema:**
```sql
users          → User accounts
sessions       → Active login sessions
watch_history  → Viewing progress
watchlist      → Saved content
favorites      → Liked content (future feature)
```

**Key Files:**
- `lib/db.ts` - Database schema and queries
- `app/api/user/history/route.ts` - History API
- `app/api/user/watchlist/route.ts` - Watchlist API
- `app/hooks/useUserLists.ts` - Custom hooks
- `app/contexts/WatchlistContext.tsx` - Watchlist state

---

## Request Flow Examples

### Example 1: User Browsing Home Page

```
1. GET / (Home Page)
   ↓
2. Middleware checks session cookie
   ↓
3. Server renders page.tsx
   ↓
4. Client-side: useEffect triggers
   ↓
5. Parallel API calls:
   - GET /api/trending?type=movie
   - GET /api/trending?type=tv
   - GET /api/popular?type=movie
   - GET /api/popular?type=tv
   - GET /api/browse/tv?language=ja&genre=16
   ↓
6. Each API route:
   - Checks Next.js cache (5min TTL)
   - If miss: Calls TMDB API
   - Caches response
   - Returns JSON
   ↓
7. Client receives all responses
   ↓
8. Feed algorithm: dedupe, mix, shuffle
   ↓
9. Render MovieCard components
   ↓
10. User scrolls → Intersection Observer
   ↓
11. Load more API call (next page)
   ↓
12. Append to feed
```

### Example 2: User Watching a Movie

```
1. User clicks movie card
   ↓
2. Navigate to /watch/movie/12345
   ↓
3. Middleware validates session
   ↓
4. Load watch page
   ↓
5. Parallel requests:
   - GET /api/movie/12345 (details)
   - GET /api/user/history (if logged in)
   ↓
6. Movie API:
   - Fetch from TMDB (cached 1hr)
   - Get IMDb ID
   - Return movie data
   ↓
7. Generate streaming URLs:
   - getAllEmbedUrls(imdbId, tmdbId, 'movie')
   - Creates 12+ embed URLs
   ↓
8. Load primary source in iframe
   ↓
9. User watches → Progress tracking:
   - VideoPlayer emits progress events
   - Save every 10 seconds
   - POST /api/user/history
   ↓
10. If source fails:
   - tryNextSource() called
   - Switch to next provider
   - Reload iframe
```

### Example 3: User Login

```
1. POST /api/auth/login
   Body: { username, password }
   ↓
2. lib/auth.ts: authenticateUser()
   - Query SQLite: userQueries.findByUsername
   - Verify password: bcrypt.compare()
   ↓
3. If valid:
   - createSession(userId)
   - Generate UUID session ID
   - Store in sessions table
   - Create JWT token
   ↓
4. setSessionCookie(token)
   - Set HTTP-only cookie
   - 1 year expiration
   ↓
5. Return { user: { id, username, displayName } }
   ↓
6. Client: AuthContext updates state
   ↓
7. UI updates (show user menu, etc.)
```

---

## Database Architecture

### Tables

**users**
- `id` (PK)
- `username` (unique)
- `password_hash` (bcrypt)
- `display_name`
- `created_at`

**sessions**
- `id` (PK, UUID)
- `user_id` (FK → users)
- `expires_at`
- `created_at`

**watch_history**
- `id` (PK)
- `user_id` (FK → users)
- `media_type` ('movie' | 'tv')
- `media_id` (TMDB ID)
- `title`
- `poster_path`
- `season` (nullable, for TV)
- `episode` (nullable, for TV)
- `progress_seconds`
- `duration_seconds`
- `last_watched_at`
- Unique constraint: (user_id, media_type, media_id, season, episode)

**watchlist**
- `id` (PK)
- `user_id` (FK → users)
- `media_type` ('movie' | 'tv')
- `media_id` (TMDB ID)
- `title`
- `poster_path`
- `added_at`
- Unique constraint: (user_id, media_type, media_id)

**favorites** (future feature)
- Similar structure to watchlist

### Indexes
- `idx_watch_history_user` - Fast history queries
- `idx_watchlist_user` - Fast watchlist queries
- `idx_sessions_expires` - Session cleanup

### Database Features
- **WAL Mode**: Enables concurrent reads/writes
- **Prepared Statements**: All queries use prepared statements for performance
- **Cascade Deletes**: Deleting user removes all related data

---

## Performance Optimizations

### Frontend
1. **Image Optimization**
   - Next.js Image component with lazy loading
   - Smaller thumbnails (w154) for cards
   - Blur placeholders during load
   - AVIF/WebP format support

2. **Code Splitting**
   - Automatic route-based splitting
   - Dynamic imports for heavy components
   - React.memo for expensive components

3. **State Management**
   - useMemo/useCallback to prevent re-renders
   - Context API for global state
   - Optimistic UI updates

4. **Infinite Scroll**
   - Intersection Observer (native, no library)
   - Throttled loading
   - Virtual scrolling ready

### Backend
1. **API Caching**
   - Next.js revalidation (5min browse, 1hr details)
   - HTTP cache headers
   - CDN caching via Cloudflare

2. **Database**
   - Prepared statements (faster queries)
   - Indexes on frequently queried columns
   - WAL mode for concurrency

3. **Parallel Requests**
   - Home page loads 5 sources simultaneously
   - Promise.all() for concurrent API calls

### Infrastructure
1. **Nginx**
   - Gzip compression
   - Static asset caching (1 year)
   - Proxy caching for API routes

2. **Cloudflare**
   - Edge caching
   - DDoS protection
   - Brotli compression
   - Auto minify

---

## Security Features

1. **Authentication**
   - Bcrypt password hashing (10 rounds)
   - JWT tokens with expiration
   - HTTP-only cookies (XSS protection)
   - Session validation on protected routes

2. **Authorization**
   - Middleware protects routes
   - API endpoints check authentication
   - User data isolated by user_id

3. **Input Validation**
   - TypeScript type safety
   - SQL injection prevention (prepared statements)
   - XSS protection (React auto-escaping)

4. **Headers**
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - Secure cookies (in production)

---

## Deployment Architecture

### Production Stack
```
Internet
  ↓
Cloudflare (CDN, SSL)
  ↓
Nginx (Reverse Proxy, SSL Termination)
  ↓
PM2 (Process Manager)
  ↓
Next.js App (Port 3000)
  ↓
SQLite Database (File System)
```

### Scaling Considerations

**Current (Single Server):**
- SQLite database (file-based)
- Single Node.js process
- Suitable for: <10,000 concurrent users

**Future Scaling Options:**
1. **Database**: Migrate to PostgreSQL for multi-server
2. **Caching**: Add Redis for session storage
3. **Load Balancing**: Multiple PM2 instances behind Nginx
4. **CDN**: Already using Cloudflare
5. **Media**: Move to object storage (S3, Cloudflare R2)

---

## API Endpoints

### Public Endpoints
- `GET /api/search?q=query` - Search content
- `GET /api/trending?type=movie|tv&page=1` - Trending content
- `GET /api/popular?type=movie|tv&page=1` - Popular content
- `GET /api/movie/[id]` - Movie details
- `GET /api/tv/[id]` - TV show details
- `GET /api/browse/movies?genre=X&year=Y` - Browse movies
- `GET /api/browse/tv?genre=X&year=Y` - Browse TV

### Protected Endpoints (Require Auth)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/user/history` - Get watch history
- `POST /api/user/history` - Save watch progress
- `DELETE /api/user/history` - Remove from history
- `GET /api/user/watchlist` - Get watchlist
- `POST /api/user/watchlist` - Add to watchlist
- `DELETE /api/user/watchlist` - Remove from watchlist
- `GET /api/user/episodes` - Get watched episodes (TV)

---

## Key Features

### User Features
1. **Personalized Home Feed**
   - Mixed content (movies, TV, anime)
   - Infinite scroll
   - Shuffled for variety

2. **Continue Watching**
   - Shows items with >60s progress
   - Episode tracking for TV shows
   - Progress bars

3. **Watchlist**
   - Save for later
   - Quick access
   - Persistent storage

4. **Search**
   - Live search (as you type)
   - Full search results
   - Movies and TV shows

5. **Video Player**
   - Multiple source fallback
   - Manual source selection
   - Episode navigation (TV)
   - Progress tracking
   - Mark as watched

6. **Browse Sections**
   - Movies
   - TV Shows
   - Anime

### Technical Features
1. **Performance**
   - Fast page loads (<2s)
   - Optimized images
   - API caching
   - Code splitting

2. **Reliability**
   - Multi-source streaming
   - Automatic fallback
   - Error handling
   - Graceful degradation

3. **User Experience**
   - Responsive design
   - Dark theme
   - Smooth animations
   - Loading states

---

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
cp .env.example .env.local  # Configure environment
npm run seed         # Create demo users (optional)
npm run dev          # Start dev server (port 3000)
```

### Production Build
```bash
npm run build        # Build optimized production bundle
npm start            # Start production server
```

### PM2 Deployment
```bash
pm2 start ecosystem.config.js  # Start with PM2
pm2 save                        # Save configuration
pm2 startup                     # Enable auto-start
```

---

## File Structure Overview

```
mikkystream/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST endpoints)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── browse/        # Content discovery
│   │   ├── movie/         # Movie details
│   │   ├── tv/            # TV show details
│   │   ├── search/        # Search
│   │   ├── trending/      # Trending content
│   │   └── user/          # User data (history, watchlist)
│   ├── browse/            # Browse pages (movies, tv, anime)
│   ├── components/        # React components
│   ├── contexts/         # React contexts (Auth, Watchlist)
│   ├── hooks/             # Custom React hooks
│   ├── login/             # Login page
│   ├── watch/             # Video player page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                    # Utility libraries
│   ├── auth.ts            # Authentication logic
│   ├── db.ts              # Database setup & queries
│   ├── tmdb.ts            # TMDB API client
│   └── vidsrc.ts          # Streaming source URLs
├── types/                  # TypeScript definitions
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── middleware.ts           # Route protection
└── next.config.mjs        # Next.js configuration
```

---

## Future Enhancements

### Planned Features
1. **Favorites System** - Like content (database table exists)
2. **Recommendations** - ML-based content suggestions
3. **User Profiles** - Customizable profiles
4. **Social Features** - Share, reviews, ratings
5. **Download Support** - Offline viewing
6. **Chromecast** - Cast to TV
7. **Mobile App** - React Native version

### Technical Improvements
1. **Database Migration** - PostgreSQL for scaling
2. **Redis Caching** - Session and API cache
3. **WebSocket** - Real-time features
4. **Analytics** - User behavior tracking
5. **A/B Testing** - Feature experimentation
6. **Monitoring** - APM, error tracking

---

## Conclusion

MikkyStream is a production-ready streaming platform built with modern web technologies. The architecture is designed for performance, scalability, and maintainability. The codebase follows best practices with TypeScript, proper error handling, and comprehensive caching strategies.

The platform successfully aggregates content from multiple sources, provides a personalized user experience, and maintains high performance through intelligent caching and optimization techniques.

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Engineering Team
