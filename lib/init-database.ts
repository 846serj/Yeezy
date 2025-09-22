import { initializeDatabase } from './database';

// Initialize database on module load
let isInitialized = false;

export async function ensureDatabaseInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      // Don't throw error in development to allow fallback to in-memory storage
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV !== 'production') {
  ensureDatabaseInitialized().catch(console.error);
}
