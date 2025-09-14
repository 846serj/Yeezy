import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// Initialize database tables
export function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_sites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      site_url TEXT NOT NULL,
      username TEXT NOT NULL,
      app_password TEXT NOT NULL,
      site_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized');
}

// User functions
export function createUser(email: string, password: string) {
  const passwordHash = bcrypt.hashSync(password, 10);
  
  try {
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email, passwordHash);
    return { id: result.lastInsertRowid, email };
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

export function getUserByEmail(email: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as { id: number; email: string; password_hash: string } | undefined;
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

// User sites functions
export function addUserSite(userId: number, siteUrl: string, username: string, appPassword: string, siteName?: string) {
  const stmt = db.prepare(`
    INSERT INTO user_sites (user_id, site_url, username, app_password, site_name) 
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, siteUrl, username, appPassword, siteName);
  return { id: result.lastInsertRowid };
}

export function getUserSites(userId: number) {
  const stmt = db.prepare('SELECT * FROM user_sites WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as Array<{
    id: number;
    user_id: number;
    site_url: string;
    username: string;
    app_password: string;
    site_name: string | null;
    created_at: string;
  }>;
}

export function deleteUserSite(userId: number, siteId: number) {
  const stmt = db.prepare('DELETE FROM user_sites WHERE id = ? AND user_id = ?');
  return stmt.run(siteId, userId);
}

// Initialize database on import
initDatabase();
