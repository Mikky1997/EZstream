# Movie Streaming Platform

A modern web application for searching and streaming movies, TV series, and anime using multiple streaming sources.

## Features

- 🔍 **Search Movies & TV Shows** - Search using TMDB API
- 🎬 **Multiple Streaming Sources** - 12+ streaming providers with automatic fallback
- 🎌 **Anime Support** - Dedicated anime section with sub/dub preferences
- 🌍 **Arabic Content Support** - Special handling for Arabic movies with TMDB ID fallback
- 📺 **TV Show Support** - Full season/episode selection
- 🎨 **Modern UI** - Clean, dark-themed interface built with Tailwind CSS
- ⚡ **Fast & Responsive** - Built with Next.js 14 for optimal performance

## Streaming Sources

The platform supports multiple streaming providers:
- VidSrc.me (primary)
- VidSrc.cc
- VidSrc.xyz
- VidSrc.pro
- 2Embed
- SmashyStream
- MoviesAPI
- MultiEmbed
- Embed.su
- AutoEmbed
- VidLink
- Nontongo

Each source is tried automatically if the previous one doesn't work.

## Prerequisites

- Node.js 18+ and npm
- TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/))

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   TMDB_ACCESS_TOKEN=your_tmdb_access_token_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Search for content:**
   - Enter a movie or TV show title in the search bar
   - Browse through the results

2. **Watch content:**
   - Click on any movie or TV show card
   - Use the source selector to try different streaming providers
   - Sources with "(TMDB)" work better for non-English content

3. **Watch Anime:**
   - Browse the Anime section for Japanese animation
   - Select sub (Japanese audio) or dub (English audio) preference
   - Choose your preferred streaming source

4. **Watch TV Shows:**
   - Select season and episode from the dropdowns
   - Sources automatically update when you change episodes

## Project Structure

```
/
├── app/
│   ├── api/              # API routes
│   ├── browse/           # Browse pages (movies, tv, anime, arabic)
│   ├── components/       # React components
│   ├── watch/            # Watch page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── lib/
│   ├── tmdb.ts           # TMDB API client
│   └── vidsrc.ts         # Streaming sources
└── types/
    └── index.ts          # TypeScript types
```

## Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TMDB API** - Movie/TV show data
- **VidSrc & Other Providers** - Streaming embeds

## Notes

- Streaming availability depends on external sources
- Not all content is available on all sources - try different providers
- Arabic content has limited availability - sources with "(TMDB)" tag work best
- Some sources may have ads - try different sources for a better experience

## License

This project is for educational purposes only.
