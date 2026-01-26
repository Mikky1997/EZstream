# MikkyStream

A modern, high-performance streaming platform built with Next.js 14, featuring movies, TV shows, and anime with a sleek dark-themed UI.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite)

## Features

- **User Authentication** - Secure login with JWT sessions and bcrypt password hashing
- **Watch History** - Continue watching from where you left off
- **Watchlist** - Save movies and shows to watch later
- **Multi-Source Streaming** - 12+ streaming providers with automatic fallback
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
mikkystream/
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
   git clone https://github.com/yourusername/mikkystream.git
   cd mikkystream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your TMDB API key:
   ```env
   TMDB_API_KEY=your_api_key_here
   JWT_SECRET=your_random_secret_here
   ```

4. **Seed the database** (optional - creates demo users)
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

- **Image Optimization** - Smaller thumbnails (w154), lazy loading, blur placeholders
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

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Get current user |
| `/api/search` | GET | Search movies/TV |
| `/api/trending` | GET | Trending content |
| `/api/popular` | GET | Popular content |
| `/api/movie/[id]` | GET | Movie details |
| `/api/tv/[id]` | GET | TV show details |
| `/api/user/history` | GET/POST/DELETE | Watch history |
| `/api/user/watchlist` | GET/POST/DELETE | User watchlist |

## Streaming Sources

The platform supports multiple streaming providers with automatic fallback:

- VidSrc (primary)
- 2Embed
- SmashyStream
- MoviesAPI
- AutoEmbed
- And more...

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is for educational purposes only. All streaming content is provided by third-party services.

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for the comprehensive movie/TV database
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
