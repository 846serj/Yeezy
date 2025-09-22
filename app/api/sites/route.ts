import { NextRequest, NextResponse } from 'next/server';
import { getUserSites, addUserSite, deleteUserSite } from '@/lib/database';
import * as jose from 'jose';
import { addCorsHeaders } from '../auth/middleware';

// Define allowed methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'iad1';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return String(payload.userId); // Ensure it's always a string
  } catch {
    return null;
  }
}

// Add OPTIONS method handler
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  }));
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sites = await getUserSites(userId);
    return addCorsHeaders(NextResponse.json({ sites }));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const siteData = await request.json();

    if (!siteData.site_url || !siteData.username || !siteData.app_password) {
      return NextResponse.json({ error: 'Site URL, username, and app password are required' }, { status: 400 });
    }

    const result = await addUserSite(
      userId, 
      siteData.site_url, 
      siteData.username, 
      siteData.app_password, 
      siteData.site_name
    );
    
    return addCorsHeaders(NextResponse.json({ 
      message: 'Site added successfully',
      site: result
    }));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('id');
    
    if (!siteId) {
      return NextResponse.json({ error: 'Site ID required' }, { status: 400 });
    }

    const result = await deleteUserSite(userId, siteId);
    if (!result.success) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return addCorsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}