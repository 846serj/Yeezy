import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { addCorsHeaders } from '../auth/middleware';
import { 
  canUseImageCrop, 
  incrementImageUsage, 
  getMonthlyImageUsage,
  ensureDatabaseInitialized 
} from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const usageInfo = await canUseImageCrop(userId);
    const monthlyUsage = await getMonthlyImageUsage(userId);

    return addCorsHeaders(NextResponse.json({
      canUse: usageInfo.canUse,
      usage: usageInfo.usage,
      limit: usageInfo.limit,
      planType: usageInfo.planType,
      monthlyUsage
    }));
  } catch (error) {
    console.error('Error getting usage info:', error);
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
    
    // Check if user can use image crop before incrementing
    const usageInfo = await canUseImageCrop(userId);
    if (!usageInfo.canUse) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        canUse: false,
        usage: usageInfo.usage,
        limit: usageInfo.limit,
        planType: usageInfo.planType
      }, { status: 403 });
    }

    // Increment usage
    await incrementImageUsage(userId);
    
    // Get updated usage info
    const updatedUsageInfo = await canUseImageCrop(userId);

    return addCorsHeaders(NextResponse.json({
      success: true,
      canUse: updatedUsageInfo.canUse,
      usage: updatedUsageInfo.usage,
      limit: updatedUsageInfo.limit,
      planType: updatedUsageInfo.planType
    }));
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
