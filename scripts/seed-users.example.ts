/**
 * Seed script to create predefined users
 * Run with: npx tsx scripts/seed-users.ts
 * 
 * IMPORTANT: Copy this file to seed-users.ts and add your users
 * seed-users.ts is gitignored and will not be committed to the repository
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Database path
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mikkystream.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Predefined users - password = username for ease of use
// Add your users here
const users = [
  // Example:
  // { username: 'user1', password: 'user1', displayName: 'User 1' },
  // { username: 'user2', password: 'user2', displayName: 'User 2' },
];

async function seedUsers() {
  console.log('Seeding users...\n');
  
  const insertStmt = db.prepare(
    'INSERT OR REPLACE INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  );
  
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    insertStmt.run(user.username, passwordHash, user.displayName);
    console.log(`Created/updated user: ${user.username} (password: ${user.password})`);
  }
  
  console.log('\nDone! Users created:');
  console.log('---');
  users.forEach(u => {
    console.log(`  Username: ${u.username}`);
    console.log(`  Password: ${u.password}`);
    console.log('---');
  });
}

seedUsers()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding users:', err);
    db.close();
    process.exit(1);
  });
