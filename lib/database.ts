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

// Fallback in-memory store for development when Postgres is not available
const users = new Map<string, {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}>();

const userSites = new Map<string, Array<{
  id: string;
  user_id: string;
  site_url: string;
  username: string;
  app_password: string;
  site_name: string | null;
  created_at: string;
}>>();

// Check if we're in production with Postgres available
const isPostgresAvailable = process.env.POSTGRES_URL && process.env.NODE_ENV === 'production';

export async function createUser(email: string, password: string): Promise<{ id: number | string; email: string }> {
  if (isPostgresAvailable) {
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
  } else {
    // Fallback to in-memory storage
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = Math.random().toString(36).substring(2);
    
    if (users.has(email)) {
      throw new Error('Email already exists');
    }
    
    const user = {
      id,
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };
    
    users.set(email, user);
    userSites.set(id, []); // Initialize empty sites array for user
    return { id, email };
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (isPostgresAvailable) {
    try {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  } else {
    // Fallback to in-memory storage
    const user = users.get(email);
    if (!user) return null;
    
    return {
      id: parseInt(user.id) || 0,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: user.created_at
    };
  }
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export async function getUserSites(userId: number | string): Promise<UserSite[]> {
  if (isPostgresAvailable) {
    try {
      const result = await sql`
        SELECT * FROM user_sites 
        WHERE user_id = ${typeof userId === 'string' ? parseInt(userId) : userId}
        ORDER BY created_at DESC
      `;
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user sites:', error);
      return [];
    }
  } else {
    // Fallback to in-memory storage
    const sites = userSites.get(userId.toString()) || [];
    return sites.map(site => ({
      id: parseInt(site.id) || 0,
      user_id: parseInt(site.user_id) || 0,
      site_url: site.site_url,
      username: site.username,
      app_password: site.app_password,
      site_name: site.site_name,
      created_at: site.created_at,
      updated_at: site.created_at
    }));
  }
}

export async function addUserSite(
  userId: number | string, 
  siteUrl: string, 
  username: string, 
  appPassword: string, 
  siteName?: string
): Promise<{ id: number | string }> {
  if (isPostgresAvailable) {
    try {
      const result = await sql`
        INSERT INTO user_sites (user_id, site_url, username, app_password, site_name)
        VALUES (${typeof userId === 'string' ? parseInt(userId) : userId}, ${siteUrl}, ${username}, ${appPassword}, ${siteName || null})
        RETURNING id
      `;
      
      return { id: result.rows[0].id };
    } catch (error) {
      console.error('Error adding user site:', error);
      throw error;
    }
  } else {
    // Fallback to in-memory storage
    const sites = userSites.get(userId.toString()) || [];
    const id = Math.random().toString(36).substring(2);
    
    const site = {
      id,
      user_id: userId.toString(),
      site_url: siteUrl,
      username,
      app_password: appPassword,
      site_name: siteName || null,
      created_at: new Date().toISOString()
    };
    
    sites.push(site);
    userSites.set(userId.toString(), sites);
    return { id };
  }
}

export async function deleteUserSite(userId: number | string, siteId: number | string): Promise<{ success: boolean }> {
  if (isPostgresAvailable) {
    try {
      const result = await sql`
        DELETE FROM user_sites 
        WHERE id = ${typeof siteId === 'string' ? parseInt(siteId) : siteId} 
        AND user_id = ${typeof userId === 'string' ? parseInt(userId) : userId}
      `;
      
      return { success: (result.rowCount ?? 0) > 0 };
    } catch (error) {
      console.error('Error deleting user site:', error);
      return { success: false };
    }
  } else {
    // Fallback to in-memory storage
    const sites = userSites.get(userId.toString()) || [];
    const updatedSites = sites.filter(site => site.id !== siteId.toString());
    userSites.set(userId.toString(), updatedSites);
    return { success: true };
  }
}

// Initialize database and create test account
export async function initializeDatabase() {
  if (isPostgresAvailable) {
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

  // Create test account (only in development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const existingUser = await getUserByEmail('test@example.com');
      if (!existingUser) {
        await createUser('test@example.com', 'password123');
        console.log('✅ Test account created successfully');
      }
    } catch (error) {
      console.error('Error creating test account:', error);
    }
  }
}