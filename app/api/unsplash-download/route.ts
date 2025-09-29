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

    // Extract photo ID from download_location URL
    // The download_location URL format is: https://api.unsplash.com/photos/{photo_id}/download
    const photoIdMatch = downloadLocation.match(/\/photos\/([^\/]+)\/download/);
    if (!photoIdMatch) {
      console.error('❌ [UNSPLASH DEBUG] Could not extract photo ID from download location:', downloadLocation);
      return NextResponse.json({ error: 'Invalid download location URL' }, { status: 400 });
    }

    const photoId = photoIdMatch[1];
    console.log('🆔 [UNSPLASH DEBUG] Extracted photo ID:', photoId);

    // Make the correct API call to Unsplash's download endpoint
    const downloadUrl = `https://api.unsplash.com/photos/${photoId}/download`;
    console.log('🚀 [UNSPLASH DEBUG] Making request to Unsplash download endpoint...');
    console.log('🔗 [UNSPLASH DEBUG] URL:', downloadUrl);

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    console.log('📊 [UNSPLASH DEBUG] Response status:', response.status);
    console.log('📊 [UNSPLASH DEBUG] Response statusText:', response.statusText);
    
    // Log the response body to see what Unsplash returns
    const responseText = await response.text();
    console.log('📄 [UNSPLASH DEBUG] Response body:', responseText);

    if (!response.ok) {
      console.error('❌ [UNSPLASH DEBUG] Failed to trigger Unsplash download tracking:', response.status, response.statusText);
      console.error('❌ [UNSPLASH DEBUG] Error response:', responseText);
      // Don't fail the request if tracking fails - this is just for analytics
    } else {
      console.log('✅ [UNSPLASH DEBUG] Successfully triggered Unsplash download tracking!');
      console.log('📄 [UNSPLASH DEBUG] Unsplash response:', responseText);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [UNSPLASH DEBUG] Error triggering Unsplash download tracking:', error);
    // Don't fail the request if tracking fails - this is just for analytics
    return NextResponse.json({ success: true });
  }
}
