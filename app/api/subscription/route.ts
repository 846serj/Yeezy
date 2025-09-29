import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { addCorsHeaders } from '../auth/middleware';
import { 
  getUserSubscription,
  createUserSubscription,
  updateUserSubscription,
  ensureDatabaseInitialized 
} from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  }));
}

export async function GET(request: NextRequest) {
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

    const subscription = await getUserSubscription(userId);
    
    return addCorsHeaders(NextResponse.json({
      subscription: subscription || { plan_type: 'free', status: 'active' }
    }));
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

    const { planType, stripeCustomerId, stripeSubscriptionId } = await request.json();

    if (!planType || !['free', 'premium'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Check if user already has a subscription
    const existingSubscription = await getUserSubscription(userId);
    if (existingSubscription) {
      return NextResponse.json({ error: 'User already has a subscription' }, { status: 400 });
    }

    const subscription = await createUserSubscription(
      userId, 
      planType, 
      stripeCustomerId, 
      stripeSubscriptionId
    );
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      subscription
    }));
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const updates = await request.json();

    // Validate updates
    const allowedUpdates = ['plan_type', 'status', 'stripe_customer_id', 'stripe_subscription_id', 'current_period_start', 'current_period_end'];
    const updateKeys = Object.keys(updates);
    const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));
    
    if (invalidKeys.length > 0) {
      return NextResponse.json({ 
        error: `Invalid update fields: ${invalidKeys.join(', ')}` 
      }, { status: 400 });
    }

    if (updates.plan_type && !['free', 'premium'].includes(updates.plan_type)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (updates.status && !['active', 'cancelled', 'past_due'].includes(updates.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const subscription = await updateUserSubscription(userId, updates);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      subscription
    }));
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
