import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  try {
    // Validate that it's a supported Openverse source
    const supportedDomains = [
      'inaturalist-open-data.s3.amazonaws.com',
      'cdn.stocksnap.io',
      'live.staticflickr.com',
      'farm.staticflickr.com',
      'images.rawpixel.com',
      'cdn.rawpixel.com',
      'api.openverse.org' // Openverse's own thumbnail service
    ];

    const url = new URL(imageUrl);
    if (!supportedDomains.some(domain => url.hostname.includes(domain))) {
      return NextResponse.json({ error: 'Unsupported image source' }, { status: 400 });
    }

    // Prepare headers based on the source
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    };

    // Add Openverse API authorization for their own thumbnail service
    if (url.hostname.includes('api.openverse.org')) {
      const openverseClientId = process.env.OPENVERSE_CLIENT_ID;
      const openverseClientSecret = process.env.OPENVERSE_CLIENT_SECRET;
      
      if (openverseClientId && openverseClientSecret) {
        try {
          // Get access token for Openverse API
          const tokenResponse = await fetch('https://api.openverse.org/v1/auth_tokens/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: openverseClientId,
              client_secret: openverseClientSecret,
            }),
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            headers['Authorization'] = `Bearer ${tokenData.access_token}`;
          }
        } catch (error) {
          console.error('❌ [PROXY ERROR] Failed to get Openverse token:', error);
        }
      }
    } else {
      // For other sources, add referer and origin
      headers['Referer'] = 'https://openverse.org/';
      headers['Origin'] = 'https://openverse.org';
    }

    // Fetch the image with appropriate headers
    const response = await fetch(imageUrl, { headers });

    if (!response.ok) {
      console.error(`❌ [PROXY ERROR] Failed to fetch image: ${response.status} ${response.statusText} for ${imageUrl}`);
      return NextResponse.json({ 
        error: `Failed to fetch image: ${response.status} ${response.statusText}`,
        url: imageUrl 
      }, { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('❌ [PROXY ERROR] Failed to proxy image:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}
