import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { downloadLocation } = await request.json();
    
    console.log('🔍 [UNSPLASH DEBUG] Download tracking request received');
    console.log('📍 [UNSPLASH DEBUG] Download location:', downloadLocation);

    if (!downloadLocation) {
      console.error('❌ [UNSPLASH DEBUG] No download location provided');
      return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('❌ [UNSPLASH DEBUG] Unsplash access key not configured');
      return NextResponse.json({ error: 'Unsplash access key not configured' }, { status: 500 });
    }

    console.log('🚀 [UNSPLASH DEBUG] Making request to Unsplash download endpoint...');
    console.log('🔗 [UNSPLASH DEBUG] URL:', downloadLocation);

    // Trigger the download tracking endpoint asynchronously
    // This increments the download counter for the photographer
    const response = await fetch(downloadLocation, {
      method: 'GET',
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    console.log('📊 [UNSPLASH DEBUG] Response status:', response.status);
    console.log('📊 [UNSPLASH DEBUG] Response statusText:', response.statusText);

    if (!response.ok) {
      console.error('❌ [UNSPLASH DEBUG] Failed to trigger Unsplash download tracking:', response.status, response.statusText);
      // Don't fail the request if tracking fails - this is just for analytics
    } else {
      console.log('✅ [UNSPLASH DEBUG] Successfully triggered Unsplash download tracking!');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [UNSPLASH DEBUG] Error triggering Unsplash download tracking:', error);
    // Don't fail the request if tracking fails - this is just for analytics
    return NextResponse.json({ success: true });
  }
}
