import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { addCorsHeaders } from '../auth/middleware';
import { 
  createStripeCustomer, 
  createCheckoutSession,
  createStripeSubscription 
} from '@/lib/stripe';
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
    const userEmail = decoded.email;

    // Check if user already has a premium subscription
    const existingSubscription = await getUserSubscription(userId);
    if (existingSubscription?.plan_type === 'premium' && existingSubscription.status === 'active') {
      return NextResponse.json({ 
        error: 'User already has an active premium subscription' 
      }, { status: 400 });
    }

    // Get the base URL for success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Create or get Stripe customer
    let customerId: string;
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      const customer = await createStripeCustomer(userEmail);
      customerId = customer.id;
      
      // Create a free subscription record with Stripe customer ID
      await createStripeSubscription(customerId);
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      `${baseUrl}/dashboard?success=true`,
      `${baseUrl}/dashboard?canceled=true`
    );

    return addCorsHeaders(NextResponse.json({
      sessionId: session.id,
      url: session.url
    }));
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
