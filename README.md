# EZstream

![EZstream Banner](public/banner.jpg)

A modern, high-performance streaming platform built with Next.js 14, featuring movies, TV shows, and anime with a sleek dark-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite)

## Features

- **User Authentication** - Secure login with JWT sessions and bcrypt password hashing
- **Watch History** - Continue watching from where you left off
- **Watchlist** - Save movies and shows to watch later
- **Multi-Source Streaming** - 9 streaming providers with automatic fallback
- **Smart Source Selection** - Optimized source order for movies, TV, and anime
- **Real-time Search** - Instant search with live results as you type
- **Infinite Scroll** - Seamless content discovery with lazy loading
- **Responsive Design** - Optimized for all screen sizes
- **Performance Optimized** - Fast image loading, API caching, and minimal bundle size

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite with better-sqlite3 (WAL mode) |
| Auth | JWT (jose) + bcryptjs |
| API | TMDB for metadata |
| Deployment | PM2 + Nginx + Cloudflare |

## Project Structure

```
ezstream/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── browse/          # Content discovery
│   │   ├── movie/           # Movie details
│   │   ├── tv/              # TV show details
│   │   ├── search/          # Search functionality
│   │   └── user/            # User data (history, watchlist)
│   ├── browse/              # Browse pages
│   │   ├── anime/           # Anime section
│   │   ├── movies/          # Movies section
│   │   └── tv/              # TV shows section
│   ├── components/          # Reusable components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   └── watch/               # Video player page
├── lib/                     # Utility libraries
│   ├── auth.ts              # Authentication helpers
│   ├── db.ts                # Database setup & queries
│   ├── tmdb.ts              # TMDB API client
│   └── vidsrc.ts            # Streaming sources
├── types/                   # TypeScript definitions
└── public/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- TMDB API key ([Get one free](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ezstream.git
   cd ezstream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your TMDB API key and session secret:
   ```env
   TMDB_API_KEY=your_api_key_here
   SESSION_SECRET=your_random_secret_here
   ```
   
   Generate a secure session secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Seed the database** (optional - creates demo users)
   
   First, copy the example seed file and add your users:
   ```bash
   cp scripts/seed-users.example.ts scripts/seed-users.ts
   ```
   
   Then edit `scripts/seed-users.ts` and add your users to the array.
   
   Finally, run the seed script:
   ```bash
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

## Performance Optimizations

This project implements several performance best practices:

- **Image Loading** - TMDB CDN with optimized sizes, lazy loading, blur placeholders
- **API Caching** - Server-side caching for TMDB responses (5min browse, 1hr details)
- **Code Splitting** - Automatic route-based code splitting
- **React Optimizations** - `React.memo`, `useMemo`, `useCallback` for efficient re-renders
- **Database** - SQLite with WAL mode for concurrent read/write access
- **CDN Ready** - Cloudflare integration for edge caching

## Deployment

### Production Build

```bash
npm run build
npm start
```

### PM2 (Recommended)

```bash
pm2 start ecosystem.config.js
```

### With Nginx

See `DEPLOY.md` for detailed Nginx configuration and Cloudflare setup.

## Streaming Sources

The platform supports multiple streaming providers with smart ordering:

**For Movies & TV:**
1. VidSrc.me (primary - 87K movies, 1080p)
2. Embed.su
3. VidSrc.cc
4. MoviesAPI
5. AutoEmbed
6. VidSrc.pro
7. SuperEmbed
8. 2Embed
9. StreamSRC

**For Anime:**
1. AutoEmbed (primary - dedicated anime section)
2. VidSrc.me
3. Embed.su
4. 2Embed
5. And more...

## License

This project is for educational purposes only. All streaming content is provided by third-party services.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for the comprehensive movie/TV database
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
