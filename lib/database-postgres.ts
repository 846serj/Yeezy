import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// Types for our database records
export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserSite {
  id: number;
  user_id: number;
  site_url: string;
  username: string;
  app_password: string;
  site_name: string | null;
  created_at: string;
  updated_at: string;
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_sites table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        site_url VARCHAR(500) NOT NULL,
        username VARCHAR(255) NOT NULL,
        app_password VARCHAR(255) NOT NULL,
        site_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON user_sites(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sites_site_url ON user_sites(site_url)`;

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// User management functions
export async function createUser(email: string, password: string): Promise<{ id: number; email: string }> {
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
    
    const user = result.rows[0];
    return { id: user.id, email: user.email };
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Email already exists');
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// User sites management functions
export async function getUserSites(userId: number): Promise<UserSite[]> {
  try {
    const result = await sql`
      SELECT * FROM user_sites 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return result.rows;
  } catch (error) {
    console.error('Error getting user sites:', error);
    return [];
  }
}

export async function addUserSite(
  userId: number, 
  siteUrl: string, 
  username: string, 
  appPassword: string, 
  siteName?: string
): Promise<{ id: number }> {
  try {
    const result = await sql`
      INSERT INTO user_sites (user_id, site_url, username, app_password, site_name)
      VALUES (${userId}, ${siteUrl}, ${username}, ${appPassword}, ${siteName || null})
      RETURNING id
    `;
    
    return { id: result.rows[0].id };
  } catch (error) {
    console.error('Error adding user site:', error);
    throw error;
  }
}

export async function deleteUserSite(userId: number, siteId: number): Promise<{ success: boolean }> {
  try {
    const result = await sql`
      DELETE FROM user_sites 
      WHERE id = ${siteId} AND user_id = ${userId}
    `;
    
    return { success: result.rowCount > 0 };
  } catch (error) {
    console.error('Error deleting user site:', error);
    return { success: false };
  }
}

// Initialize with a test account (only in development)
export async function createTestAccount() {
  try {
    // Check if test account already exists
    const existingUser = await getUserByEmail('test@example.com');
    if (existingUser) {
      console.log('✅ Test account already exists');
      return;
    }

    // Create test account
    await createUser('test@example.com', 'password123');
    console.log('✅ Test account created successfully');
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}
