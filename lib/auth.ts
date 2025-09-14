// Simple in-memory authentication for Vercel deployment
// In production, you should use a proper database like PostgreSQL, MongoDB, or Supabase

interface User {
  id: number;
  email: string;
  password: string; // In production, this should be hashed
}

interface UserSite {
  id: number;
  user_id: number;
  site_url: string;
  username: string;
  app_password: string;
  site_name: string | null;
  created_at: string;
}

// In-memory storage (resets on each deployment)
let users: User[] = [];
let userSites: UserSite[] = [];
let nextId = 1;
let nextSiteId = 1;

export function createUser(email: string, password: string) {
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    throw new Error('Email already exists');
  }
  
  const user = {
    id: nextId++,
    email,
    password // In production, hash this with bcrypt
  };
  
  users.push(user);
  return { id: user.id, email: user.email };
}

export function getUserByEmail(email: string) {
  return users.find(u => u.email === email);
}

export function verifyPassword(password: string, storedPassword: string) {
  // In production, use bcrypt.compareSync(password, storedPassword)
  return password === storedPassword;
}

// User sites functions
export function addUserSite(userId: number, siteUrl: string, username: string, appPassword: string, siteName?: string) {
  const site = {
    id: nextSiteId++,
    user_id: userId,
    site_url: siteUrl,
    username,
    app_password: appPassword,
    site_name: siteName || null,
    created_at: new Date().toISOString()
  };
  
  userSites.push(site);
  return { id: site.id };
}

export function getUserSites(userId: number) {
  return userSites.filter(site => site.user_id === userId);
}

export function deleteUserSite(userId: number, siteId: number) {
  const index = userSites.findIndex(site => site.id === siteId && site.user_id === userId);
  if (index === -1) return false;
  
  userSites.splice(index, 1);
  return true;
}

// For demo purposes, create a default user
if (users.length === 0) {
  createUser('demo@example.com', 'password123');
  createUser('test@example.com', 'test123');
}
