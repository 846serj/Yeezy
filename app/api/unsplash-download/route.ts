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
      console.error('🔧 [UNSPLASH DEBUG] Please set UNSPLASH_ACCESS_KEY in your environment variables');
      return NextResponse.json({ error: 'Unsplash access key not configured' }, { status: 500 });
    }
    
    console.log('🔑 [UNSPLASH DEBUG] Access key found:', accessKey.substring(0, 10) + '...');

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
        'User-Agent': 'WordPress-Article-Editor/1.0 (https://your-app-domain.com)',
        'Accept': 'application/json',
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
      
      // Check for specific error conditions
      if (response.status === 401) {
        console.error('🔑 [UNSPLASH DEBUG] Authentication failed - check your UNSPLASH_ACCESS_KEY');
      } else if (response.status === 403) {
        console.error('🚫 [UNSPLASH DEBUG] Access forbidden - check API permissions');
      } else if (response.status === 404) {
        console.error('🔍 [UNSPLASH DEBUG] Photo not found - invalid photo ID:', photoId);
      }
      
      // Don't fail the request if tracking fails - this is just for analytics
    } else {
      console.log('✅ [UNSPLASH DEBUG] Successfully triggered Unsplash download tracking!');
      console.log('📄 [UNSPLASH DEBUG] Unsplash response:', responseText);
      
      // Try to parse the response to get the download URL
      try {
        const responseData = JSON.parse(responseText);
        if (responseData.url) {
          console.log('🔗 [UNSPLASH DEBUG] Download URL received:', responseData.url);
        }
      } catch (parseError) {
        console.log('📝 [UNSPLASH DEBUG] Response is not JSON, likely a redirect URL');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [UNSPLASH DEBUG] Error triggering Unsplash download tracking:', error);
    // Don't fail the request if tracking fails - this is just for analytics
    return NextResponse.json({ success: true });
  }
}
