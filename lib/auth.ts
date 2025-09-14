// Simple in-memory authentication for Vercel deployment
// In production, you should use a proper database like PostgreSQL, MongoDB, or Supabase

interface User {
  id: number;
  email: string;
  password: string; // In production, this should be hashed
}

// In-memory storage (resets on each deployment)
let users: User[] = [];
let nextId = 1;

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

// For demo purposes, create a default user
if (users.length === 0) {
  createUser('demo@example.com', 'password123');
  createUser('test@example.com', 'test123');
}
