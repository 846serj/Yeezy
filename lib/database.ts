import bcrypt from 'bcryptjs';

// In-memory store for development/demo purposes
// In production, use a proper serverless database like Vercel KV, Upstash, or PlanetScale
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

export function createUser(email: string, password: string) {
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

export function getUserByEmail(email: string) {
  return users.get(email);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function getUserSites(userId: string) {
  return userSites.get(userId) || [];
}

export function addUserSite(userId: string, siteUrl: string, username: string, appPassword: string, siteName?: string) {
  const sites = userSites.get(userId) || [];
  const id = Math.random().toString(36).substring(2);
  
  const site = {
    id,
    user_id: userId,
    site_url: siteUrl,
    username,
    app_password: appPassword,
    site_name: siteName || null,
    created_at: new Date().toISOString()
  };
  
  sites.push(site);
  userSites.set(userId, sites);
  return { id };
}

export function deleteUserSite(userId: string, siteId: string) {
  const sites = userSites.get(userId) || [];
  const updatedSites = sites.filter(site => site.id !== siteId);
  userSites.set(userId, updatedSites);
  return { success: true };
}

// Initialize with a test account
createUser('test@example.com', 'password123');