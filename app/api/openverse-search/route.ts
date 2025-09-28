import { NextRequest, NextResponse } from 'next/server';

interface OpenverseSearchParams {
  query: string;
  page: number;
  perPage: number;
  license?: string;
  category?: string;
}

interface OpenverseImage {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  creator: string;
  creator_url: string;
  license: string;
  license_version: string;
  license_url: string;
  provider: string;
  source: string;
  category: string;
  width: number;
  height: number;
  attribution: string;
  foreign_landing_url: string;
  tags: Array<{ name: string }>;
}

interface OpenverseResponse {
  result_count: number;
  page_count: number;
  page_size: number;
  page: number;
  results: OpenverseImage[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(Math.max(parseInt(searchParams.get('perPage') || '20'), 1), 20);
    const license = searchParams.get('license') || 'cc0,pdm,by,by-sa';
    const category = searchParams.get('category') || 'photograph,illustration';
    const source = searchParams.get('source'); // New parameter for source filtering

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    console.log('🔍 [OPENVERSE DEBUG] Searching Openverse for:', query);

    // Get access token
    const accessToken = await getOpenverseAccessToken();
    if (!accessToken) {
      console.log('❌ [OPENVERSE DEBUG] No access token available');
      return NextResponse.json({ error: 'Openverse authentication failed' }, { status: 500 });
    }

    // Build search URL
    const searchUrl = new URL('https://api.openverse.org/v1/images/');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('page', page.toString());
    searchUrl.searchParams.set('page_size', perPage.toString());
    searchUrl.searchParams.set('license', license);
    searchUrl.searchParams.set('category', category);
    searchUrl.searchParams.set('filter_dead', 'true');
    searchUrl.searchParams.set('mature', 'false');
    
    // Add source filtering if specified
    if (source) {
      searchUrl.searchParams.set('source', source);
      console.log('🎯 [OPENVERSE DEBUG] Filtering by source:', source);
    }

    console.log('🌐 [OPENVERSE DEBUG] Making request to:', searchUrl.toString());

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ [OPENVERSE DEBUG] API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Openverse API error' }, { status: response.status });
    }

    const data: OpenverseResponse = await response.json();
    console.log('📊 [OPENVERSE DEBUG] Openverse returned', data.results?.length || 0, 'images');

    // Transform results to match our ImageResult format
    const images = data.results?.map((image: OpenverseImage) => {
      // Map Openverse sources to their display names
      const sourceMap: Record<string, string> = {
        'flickr': 'Flickr',
        'nasa': 'NASA',
        'rawpixel': 'Rawpixel',
        'inaturalist': 'iNaturalist',
        'stocksnap': 'StockSnap.io'
      };
      
         const sourceName = sourceMap[source || ''] || 'Openverse';
         
         // Handle photographer field based on source
         let photographer = image.creator;
         if (!photographer) {
           if (source === 'rawpixel') {
             photographer = 'Rawpixel';
           } else {
             photographer = 'Unknown';
           }
         }
         
         // Handle attribution format based on source
         let attribution;
         if (source === 'rawpixel') {
           attribution = 'Photo credit: Rawpixel.com';
         } else {
           attribution = `by ${photographer} via ${sourceName}`;
         }
      
      // Use proxy for Openverse images to avoid CORS issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(image.url)}`;
      const thumbnailProxyUrl = image.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(image.thumbnail)}` : undefined;
      
      return {
        url: proxyUrl,
        full: proxyUrl, // Openverse doesn't provide separate full-size URLs
        caption: image.title || 'Openverse Image',
        source: source || 'openverse',
        thumbnail: thumbnailProxyUrl,
        link: image.foreign_landing_url,
         photographer: photographer,
         photographerUrl: image.creator_url,
         attribution: attribution,
        imageId: image.id,
        width: image.width,
        height: image.height,
        license: image.license,
        licenseUrl: image.license_url,
        provider: image.provider,
        category: image.category,
        tags: image.tags?.map(tag => tag.name) || []
      };
    }) || [];

    return NextResponse.json({ images });

  } catch (error) {
    console.error('❌ [OPENVERSE ERROR] Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOpenverseAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.OPENVERSE_CLIENT_ID;
    const clientSecret = process.env.OPENVERSE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log('❌ [OPENVERSE DEBUG] No Openverse credentials found');
      return null;
    }

    // Check if we have a cached token
    const cachedToken = await getCachedToken();
    if (cachedToken && !isTokenExpired(cachedToken)) {
      return cachedToken.access_token;
    }

    // Get new token
    const tokenResponse = await fetch('https://api.openverse.org/v1/auth_tokens/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      console.log('❌ [OPENVERSE DEBUG] Token request failed:', tokenResponse.status);
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    // Cache the token
    await cacheToken(tokenData);
    
    return tokenData.access_token;

  } catch (error) {
    console.error('❌ [OPENVERSE ERROR] Token error:', error);
    return null;
  }
}

// Simple in-memory token cache (in production, use Redis or similar)
let tokenCache: { token: any; expires: number } | null = null;

async function getCachedToken() {
  return tokenCache?.token || null;
}

async function cacheToken(tokenData: any) {
  const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour
  tokenCache = {
    token: tokenData,
    expires: Date.now() + (expiresIn * 1000)
  };
}

function isTokenExpired(tokenData: any): boolean {
  if (!tokenCache) return true;
  return Date.now() >= tokenCache.expires;
}
