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
      console.log('🔐 [USAGE DEBUG] No auth token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔐 [USAGE DEBUG] Auth token found, verifying...');
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const decoded = payload as { userId: string; email: string };
    const userId = decoded.userId;
    
    console.log('👤 [USAGE DEBUG] User ID:', userId);
    const usageInfo = await canUseImageCrop(userId);
    const monthlyUsage = await getMonthlyImageUsage(userId);

    console.log('📊 [USAGE DEBUG] Usage info:', usageInfo);

    return addCorsHeaders(NextResponse.json({
      canUse: usageInfo.canUse,
      usage: usageInfo.usage,
      limit: usageInfo.limit,
      planType: usageInfo.planType,
      monthlyUsage
    }));
  } catch (error) {
    console.error('💥 [USAGE DEBUG] Error getting usage info:', error);
    console.error('💥 [USAGE DEBUG] Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('🔐 [USAGE POST DEBUG] No auth token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('🔐 [USAGE POST DEBUG] Auth token found, verifying...');
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const decoded = payload as { userId: string; email: string };
    const userId = decoded.userId;
    
    console.log('👤 [USAGE POST DEBUG] User ID:', userId);
    
    // Check if user can use image crop before incrementing
    const usageInfo = await canUseImageCrop(userId);
    console.log('📊 [USAGE POST DEBUG] Usage check result:', usageInfo);
    
    if (!usageInfo.canUse) {
      console.log('🚫 [USAGE POST DEBUG] Usage limit exceeded');
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        canUse: false,
        usage: usageInfo.usage,
        limit: usageInfo.limit,
        planType: usageInfo.planType
      }, { status: 403 });
    }

    // Increment usage
    console.log('📈 [USAGE POST DEBUG] Incrementing usage...');
    await incrementImageUsage(userId);
    
    // Get updated usage info
    const updatedUsageInfo = await canUseImageCrop(userId);
    console.log('📊 [USAGE POST DEBUG] Updated usage info:', updatedUsageInfo);

    return addCorsHeaders(NextResponse.json({
      success: true,
      canUse: updatedUsageInfo.canUse,
      usage: updatedUsageInfo.usage,
      limit: updatedUsageInfo.limit,
      planType: updatedUsageInfo.planType
    }));
  } catch (error) {
    console.error('💥 [USAGE POST DEBUG] Error incrementing usage:', error);
    console.error('💥 [USAGE POST DEBUG] Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
