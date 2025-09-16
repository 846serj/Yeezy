import bcrypt from 'bcryptjs';

// In-memory store for development/demo purposes
// In production, use a proper serverless database like Vercel KV, Upstash, or PlanetScale
const users = new Map<string, {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}>();

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
  return { id, email };
}

export function getUserByEmail(email: string) {
  return users.get(email);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

// Initialize with a test account
createUser('test@example.com', 'password123');