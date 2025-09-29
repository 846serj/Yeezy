import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { addCorsHeaders } from '../auth/middleware';
import { createCustomerPortalSession } from '@/lib/stripe';
import { 
  getUserSubscription,
  ensureDatabaseInitialized 
} from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

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
    await ensureDatabaseInitialized();
    
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const decoded = payload as { userId: string; email: string };
    const userId = decoded.userId;

    // Get user's subscription to find Stripe customer ID
    const subscription = await getUserSubscription(userId);
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please subscribe first.' 
      }, { status: 400 });
    }

    // Get the base URL for return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create customer portal session
    const session = await createCustomerPortalSession(
      subscription.stripe_customer_id,
      `${baseUrl}/dashboard`
    );

    return addCorsHeaders(NextResponse.json({
      url: session.url
    }));
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
