import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '../middleware';
import { createUser, ensureDatabaseInitialized } from '@/lib/database';

// Define allowed methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'iad1';

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
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await createUser(email, password);
    
    return addCorsHeaders(NextResponse.json({ 
      message: 'User created successfully',
      user: { id: user.id, email: user.email }
    }));
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
