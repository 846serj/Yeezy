import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// Types for our database records
export interface User {
  id: number | string; // Allow string for in-memory storage
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserSite {
  id: number | string; // Allow string for in-memory storage
  user_id: number | string; // Allow string for in-memory storage
  site_url: string;
  username: string;
  app_password: string;
  site_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: number | string;
  user_id: number | string;
  plan_type: 'free' | 'premium';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'cancelled' | 'past_due';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageUsage {
  id: number | string;
  user_id: number | string;
  usage_date: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Fallback in-memory store for development when Postgres is not available
// Using global variables to persist across requests in the same process
declare global {
  var __users: Map<string, {
    id: string;
    email: string;
    password_hash: string;
    created_at: string;
  }> | undefined;
  var __userSites: Map<string, Array<{
    id: string;
    user_id: string;
    site_url: string;
    username: string;
    app_password: string;
    site_name: string | null;
    created_at: string;
  }>> | undefined;
}

const users = globalThis.__users || new Map();
const userSites = globalThis.__userSites || new Map();

// Store references globally to persist across requests
globalThis.__users = users;
globalThis.__userSites = userSites;

// Check if we're in production with Postgres available
const isPostgresAvailable = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export async function createUser(email: string, password: string): Promise<{ id: number | string; email: string }> {
  if (isPostgresAvailable) {
    try {
      const passwordHash = bcrypt.hashSync(password, 10);
      
      const result = await sql`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${passwordHash})
        RETURNING id, email
      `;
      
      const user = result.rows[0] as { id: number; email: string };
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
      
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  } else {
    // Fallback to in-memory storage
    const user = users.get(email);
    
    if (!user) return null;
    
    return {
      id: user.id as any, // Keep as string for in-memory storage
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
      
      return result.rows as UserSite[];
    } catch (error) {
      console.error('Error getting user sites:', error);
      return [];
    }
  } else {
    // Fallback to in-memory storage
    const sites = userSites.get(userId.toString()) || [];
    return sites.map((site: any) => ({
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
      
      return { id: result.rows[0].id as number };
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
    const updatedSites = sites.filter((site: any) => site.id !== siteId.toString());
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

      // Create user_subscriptions table
      await sql`
        CREATE TABLE IF NOT EXISTS user_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan_type VARCHAR(50) NOT NULL DEFAULT 'free',
          stripe_customer_id VARCHAR(255),
          stripe_subscription_id VARCHAR(255),
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          current_period_start TIMESTAMP WITH TIME ZONE,
          current_period_end TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create image_usage table
      await sql`
        CREATE TABLE IF NOT EXISTS image_usage (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
          usage_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, usage_date)
        )
      `;

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_sites_user_id ON user_sites(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_sites_site_url ON user_sites(site_url)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_image_usage_user_id ON image_usage(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_image_usage_date ON image_usage(usage_date)`;

      
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
        
      }
    } catch (error) {
      console.error('Error creating test account:', error);
    }
  }
}

// Auto-initialize database when module loads
let isInitialized = false;
export async function ensureDatabaseInitialized() {
  if (!isInitialized && isPostgresAvailable) {
    try {
      await initializeDatabase();
      isInitialized = true;
      
    } catch (error) {
      console.error('❌ Database auto-initialization failed:', error);
      // Don't throw error in production to allow fallback to in-memory storage
      if (process.env.NODE_ENV === 'production') {
        
      }
    }
  }
}

// Subscription management functions
export async function getUserSubscription(userId: number | string): Promise<UserSubscription | null> {
  if (!isPostgresAvailable) {
    return null; // No subscription tracking in development
  }

  try {
    const result = await sql`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    return result.rows[0] as UserSubscription || null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

export async function createUserSubscription(
  userId: number | string,
  planType: 'free' | 'premium',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<UserSubscription> {
  if (!isPostgresAvailable) {
    throw new Error('Database not available');
  }

  try {
    const result = await sql`
      INSERT INTO user_subscriptions (user_id, plan_type, stripe_customer_id, stripe_subscription_id)
      VALUES (${userId}, ${planType}, ${stripeCustomerId || null}, ${stripeSubscriptionId || null})
      RETURNING *
    `;
    
    return result.rows[0] as UserSubscription;
  } catch (error) {
    console.error('Error creating user subscription:', error);
    throw error;
  }
}

export async function updateUserSubscription(
  userId: number | string,
  updates: Partial<Pick<UserSubscription, 'plan_type' | 'status' | 'stripe_customer_id' | 'stripe_subscription_id' | 'current_period_start' | 'current_period_end'>>
): Promise<UserSubscription | null> {
  if (!isPostgresAvailable) {
    return null;
  }

  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(updates);
    const query = `UPDATE user_subscriptions SET ${setClause} WHERE user_id = $1 RETURNING *`;
    
    const result = await sql.query(query, [userId, ...values]);
    return result.rows[0] as UserSubscription || null;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return null;
  }
}

// Image usage tracking functions
export async function getImageUsage(userId: number | string, date?: string): Promise<ImageUsage | null> {
  if (!isPostgresAvailable) {
    return null;
  }

  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await sql`
      SELECT * FROM image_usage 
      WHERE user_id = ${userId} AND usage_date = ${targetDate}
    `;
    
    return result.rows[0] as ImageUsage || null;
  } catch (error) {
    console.error('Error getting image usage:', error);
    return null;
  }
}

export async function incrementImageUsage(userId: number | string): Promise<ImageUsage> {
  if (!isPostgresAvailable) {
    throw new Error('Database not available');
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to update existing record
    const updateResult = await sql`
      UPDATE image_usage 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND usage_date = ${today}
      RETURNING *
    `;
    
    if (updateResult.rows.length > 0) {
      return updateResult.rows[0] as ImageUsage;
    }
    
    // If no existing record, create new one
    const insertResult = await sql`
      INSERT INTO image_usage (user_id, usage_date, usage_count)
      VALUES (${userId}, ${today}, 1)
      RETURNING *
    `;
    
    return insertResult.rows[0] as ImageUsage;
  } catch (error) {
    console.error('Error incrementing image usage:', error);
    throw error;
  }
}

export async function getMonthlyImageUsage(userId: number | string): Promise<number> {
  if (!isPostgresAvailable) {
    return 0;
  }

  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await sql`
      SELECT COALESCE(SUM(usage_count), 0) as total_usage
      FROM image_usage 
      WHERE user_id = ${userId} 
      AND usage_date >= ${startOfMonth.toISOString().split('T')[0]}
    `;
    
    return parseInt(result.rows[0]?.total_usage || '0');
  } catch (error) {
    console.error('Error getting monthly image usage:', error);
    return 0;
  }
}

// Check if user can use image crop (free plan: 25/month, premium: unlimited)
export async function canUseImageCrop(userId: number | string): Promise<{ canUse: boolean; usage: number; limit: number; planType: string }> {
  const subscription = await getUserSubscription(userId);
  const monthlyUsage = await getMonthlyImageUsage(userId);
  
  const planType = subscription?.plan_type || 'free';
  const limit = planType === 'premium' ? Infinity : 25;
  const canUse = monthlyUsage < limit;
  
  return {
    canUse,
    usage: monthlyUsage,
    limit: planType === 'premium' ? -1 : limit, // -1 indicates unlimited
    planType
  };
}

// Helper function to find subscription by Stripe customer ID
export async function getUserSubscriptionByStripeCustomerId(customerId: string): Promise<UserSubscription | null> {
  if (!isPostgresAvailable) {
    return null;
  }

  try {
    const result = await sql`
      SELECT * FROM user_subscriptions 
      WHERE stripe_customer_id = ${customerId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    return result.rows[0] as UserSubscription || null;
  } catch (error) {
    console.error('Error getting subscription by Stripe customer ID:', error);
    return null;
  }
}