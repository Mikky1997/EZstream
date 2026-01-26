# Setup Guide for Movie Streaming Platform

## Prerequisites Installation

### 1. Install Node.js
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support - recommended)
3. Run the installer and follow the setup wizard
4. **Verify installation:**
   - Open terminal/command prompt
   - Type: `node --version` (should show something like v20.x.x)
   - Type: `npm --version` (should show something like 10.x.x)

### 2. Get TMDB API Key (Free)
1. Go to https://www.themoviedb.org/
2. Create a free account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key - you'll need it later

### 3. (Optional) Radarr/Sonarr Setup for Automatic Downloads

Radarr and Sonarr can automatically download movies and TV shows when streaming isn't available - especially useful for Arabic content!

#### Installing Radarr (for Movies)
1. **Windows**: Download from https://radarr.video/#downloads
2. **Docker**: `docker run -d --name radarr -p 7878:7878 linuxserver/radarr`
3. **Linux/Mac**: Follow instructions at https://wiki.servarr.com/radarr

#### Getting Your Radarr API Key
1. Open Radarr web interface (http://localhost:7878)
2. Go to Settings → General
3. Under "Security", copy the **API Key**

#### Installing Sonarr (for TV Shows)
1. **Windows**: Download from https://sonarr.tv/#downloads
2. **Docker**: `docker run -d --name sonarr -p 8989:8989 linuxserver/sonarr`
3. **Linux/Mac**: Follow instructions at https://wiki.servarr.com/sonarr

#### Setting up a Download Client
Radarr/Sonarr need a download client to actually download torrents:
- **qBittorrent** (recommended): https://www.qbittorrent.org/
- **Transmission**: https://transmissionbt.com/
- **Deluge**: https://deluge-torrent.org/

In Radarr/Sonarr: Settings → Download Clients → Add your client

#### Indexers for Arabic Content
Add indexers in Radarr/Sonarr for better Arabic movie support:
- Settings → Indexers → Add → Select indexers that have Arabic content

## Project Setup (After Prerequisites)

Once Node.js is installed, the project will automatically:
1. Install all dependencies when you run `npm install`
2. Set up TypeScript configuration
3. Configure Tailwind CSS
4. Set up the development server

## Quick Start Commands

After setup is complete, you'll use these commands:

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file in the project root with:

```env
# Required - TMDB API for movie/TV info
TMDB_API_KEY=your_tmdb_api_key_here

# Optional - Radarr for automatic movie downloads
# Very useful for Arabic movies not available on streaming!
RADARR_URL=http://localhost:7878
RADARR_API_KEY=your_radarr_api_key_here

# Optional - Sonarr for automatic TV show downloads
SONARR_URL=http://localhost:8989
SONARR_API_KEY=your_sonarr_api_key_here
```

### How Radarr Integration Works

When you can't stream a movie (especially Arabic movies like Ibrahim El Abyad):
1. Click "Add to Radarr" on the watch page
2. Radarr automatically searches for the movie on your configured indexers
3. Once found, it downloads to your library
4. Movie becomes available for local playback

## VS Code / Cursor Extensions (Recommended)

The project will work without these, but they help:
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS autocomplete
- **TypeScript** - Usually built-in

## Troubleshooting

**"node: command not found"**
- Node.js isn't installed or not in PATH
- Reinstall Node.js and restart terminal

**"npm: command not found"**
- npm comes with Node.js, reinstall Node.js

**Port already in use**
- Change port in `package.json` or kill the process using port 3000

## Next Steps

1. Install Node.js (if not installed)
2. Get TMDB API key
3. Let me know when ready, and I'll create the project!
