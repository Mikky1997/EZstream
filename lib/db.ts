import Database from 'better-sqlite3';
import path from 'path';

// Database path - use environment variable or default to local data folder
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mikkystream.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Sessions table for persistent login
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Watch history (continue watching)
  CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    media_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    season INTEGER,
    episode INTEGER,
    progress_seconds INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    last_watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, media_type, media_id, season, episode)
  );

  -- Watchlist (watch later)
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    media_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, media_type, media_id)
  );

  -- Favorites
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    media_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, media_type, media_id)
  );

  -- Create indexes for faster queries
  CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, last_watched_at DESC);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id, added_at DESC);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, added_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);

export default db;

// Type definitions
export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface WatchHistoryItem {
  id: number;
  user_id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  season: number | null;
  episode: number | null;
  progress_seconds: number;
  duration_seconds: number;
  last_watched_at: string;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export interface FavoriteItem {
  id: number;
  user_id: number;
  media_type: 'movie' | 'tv';
  media_id: number;
  title: string;
  poster_path: string | null;
  added_at: string;
}

// User queries
export const userQueries = {
  findByUsername: db.prepare<[string], User>('SELECT * FROM users WHERE username = ?'),
  findById: db.prepare<[number], User>('SELECT * FROM users WHERE id = ?'),
  create: db.prepare<[string, string, string]>(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  ),
};

// Session queries
export const sessionQueries = {
  create: db.prepare<[string, number, string]>(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ),
  findById: db.prepare<[string], Session>('SELECT * FROM sessions WHERE id = ?'),
  delete: db.prepare<[string]>('DELETE FROM sessions WHERE id = ?'),
  deleteExpired: db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')"),
  deleteForUser: db.prepare<[number]>('DELETE FROM sessions WHERE user_id = ?'),
};

// Watch history queries
export const historyQueries = {
  upsert: db.prepare<[number, string, number, string, string | null, number | null, number | null, number, number]>(`
    INSERT INTO watch_history (user_id, media_type, media_id, title, poster_path, season, episode, progress_seconds, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, media_type, media_id, season, episode) 
    DO UPDATE SET 
      progress_seconds = excluded.progress_seconds,
      duration_seconds = excluded.duration_seconds,
      last_watched_at = CURRENT_TIMESTAMP
  `),
  getForUser: db.prepare<[number, number], WatchHistoryItem>(`
    SELECT wh.* FROM watch_history wh
    INNER JOIN (
      SELECT media_type, media_id, MAX(last_watched_at) as max_watched
      FROM watch_history
      WHERE user_id = ?
      GROUP BY media_type, media_id
    ) latest ON wh.media_type = latest.media_type 
            AND wh.media_id = latest.media_id 
            AND wh.last_watched_at = latest.max_watched
    WHERE wh.user_id = ?
    ORDER BY wh.last_watched_at DESC 
    LIMIT ?
  `),
  getWatchedEpisodes: db.prepare<[number, number], { season: number; episode: number; progress_seconds: number }>(`
    SELECT season, episode, progress_seconds FROM watch_history 
    WHERE user_id = ? AND media_type = 'tv' AND media_id = ? AND season IS NOT NULL AND episode IS NOT NULL
    ORDER BY season, episode
  `),
  markEpisodeWatched: db.prepare<[number, number, number, number, string, string | null]>(`
    INSERT INTO watch_history (user_id, media_type, media_id, season, episode, title, poster_path, progress_seconds, duration_seconds)
    VALUES (?, 'tv', ?, ?, ?, ?, ?, 2400, 2400)
    ON CONFLICT(user_id, media_type, media_id, season, episode) 
    DO UPDATE SET 
      progress_seconds = 2400,
      duration_seconds = 2400,
      last_watched_at = CURRENT_TIMESTAMP
  `),
  unmarkEpisodeWatched: db.prepare<[number, number, number, number]>(`
    UPDATE watch_history SET progress_seconds = 0 
    WHERE user_id = ? AND media_type = 'tv' AND media_id = ? AND season = ? AND episode = ?
  `),
  delete: db.prepare<[number, string, number]>(
    'DELETE FROM watch_history WHERE user_id = ? AND media_type = ? AND media_id = ?'
  ),
};

// Watchlist queries
export const watchlistQueries = {
  add: db.prepare<[number, string, number, string, string | null]>(
    'INSERT OR IGNORE INTO watchlist (user_id, media_type, media_id, title, poster_path) VALUES (?, ?, ?, ?, ?)'
  ),
  remove: db.prepare<[number, string, number]>(
    'DELETE FROM watchlist WHERE user_id = ? AND media_type = ? AND media_id = ?'
  ),
  getForUser: db.prepare<[number, number], WatchlistItem>(`
    SELECT * FROM watchlist 
    WHERE user_id = ? 
    ORDER BY added_at DESC 
    LIMIT ?
  `),
  check: db.prepare<[number, string, number], { count: number }>(
    'SELECT COUNT(*) as count FROM watchlist WHERE user_id = ? AND media_type = ? AND media_id = ?'
  ),
};

// Favorites queries
export const favoritesQueries = {
  add: db.prepare<[number, string, number, string, string | null]>(
    'INSERT OR IGNORE INTO favorites (user_id, media_type, media_id, title, poster_path) VALUES (?, ?, ?, ?, ?)'
  ),
  remove: db.prepare<[number, string, number]>(
    'DELETE FROM favorites WHERE user_id = ? AND media_type = ? AND media_id = ?'
  ),
  getForUser: db.prepare<[number, number], FavoriteItem>(`
    SELECT * FROM favorites 
    WHERE user_id = ? 
    ORDER BY added_at DESC 
    LIMIT ?
  `),
  check: db.prepare<[number, string, number], { count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND media_type = ? AND media_id = ?'
  ),
};
