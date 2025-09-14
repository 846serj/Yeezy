const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// Initialize database tables
function initDatabase() {
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

// Create demo users
function createDemoUsers() {
  const demoUsers = [
    { email: 'demo@example.com', password: 'password123' },
    { email: 'test@example.com', password: 'test123' }
  ];

  demoUsers.forEach(({ email, password }) => {
    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      const stmt = db.prepare('INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)');
      stmt.run(email, passwordHash);
      console.log(`Created/verified user: ${email}`);
    } catch (error) {
      console.log(`User ${email} already exists or error:`, error.message);
    }
  });
}

// Initialize database and create demo users
initDatabase();
createDemoUsers();

console.log('Demo data initialization complete!');
db.close();
