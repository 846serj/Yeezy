import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '../middleware';
import { getUserByEmail, verifyPassword, ensureDatabaseInitialized } from '@/lib/database';
import * as jose from 'jose';

// Define allowed methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'iad1';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Add OPTIONS method handler
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  }));
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    
    const user = await getUserByEmail(email);
    
    
    if (!user) {
      
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    
    const isValidPassword = verifyPassword(password, user.password_hash);
    
    
    if (!isValidPassword) {
      
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await new jose.SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ 
      message: 'Login successful',
      user: { id: user.id, email: user.email }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return addCorsHeaders(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}