import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  
  
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const sources = searchParams.get('sources')?.split(',') || ['wikiCommons'];
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '20');
  
  
  
  try {
    const { images, hasMore } = await searchImages(query, sources, page, perPage);
    
    return NextResponse.json({
      images,
      hasMore,
      page
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    
    // Return mock data as fallback
    const mockImages = [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-300)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
        full: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg',
        caption: 'Lion (Panthera leo) male Head',
        source: 'wikiCommons',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-150)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
        attribution: 'Photo by Unknown, via Wikimedia Commons'
      }
    ];
    
    
    
    return NextResponse.json({
      images: mockImages,
      hasMore: false,
      page: 1
    });
  }
}

async function searchImages(query: string, sources: string[], page: number, perPage: number) {
  const allImages: any[] = [];
  let hasMore = false;
  
  // Search Unsplash
  if (sources.includes('all') || sources.includes('unsplash')) {
    try {
      const unsplashResult = await searchUnsplash(query, page, perPage);
      allImages.push(...unsplashResult.images);
      if (unsplashResult.hasMore) hasMore = true;
    } catch (error) {
      console.error('❌ Unsplash search error:', error);
    }
  }

  // Search Pexels
  if (sources.includes('all') || sources.includes('pexels')) {
    try {
      const pexelsResult = await searchPexels(query, page, perPage);
      allImages.push(...pexelsResult.images);
      if (pexelsResult.hasMore) hasMore = true;
    } catch (error) {
      console.error('❌ Pexels search error:', error);
    }
  }

  // Search Pixabay
  if (sources.includes('all') || sources.includes('pixabay')) {
    try {
      const pixabayResult = await searchPixabay(query, page, perPage);
      allImages.push(...pixabayResult.images);
      if (pixabayResult.hasMore) hasMore = true;
    } catch (error) {
      console.error('❌ Pixabay search error:', error);
    }
  }

  // Search specific Openverse sources
  const openverseSources = ['flickr', 'nasa', 'rawpixel', 'inaturalist', 'stocksnap'];
  for (const source of openverseSources) {
    if (sources.includes(source)) {
      try {
        const sourceResult = await searchOpenverse(query, page, perPage, source);
        allImages.push(...sourceResult.images);
        if (sourceResult.hasMore) hasMore = true;
      } catch (error) {
        console.error(`❌ Openverse ${source} search error:`, error);
      }
    }
  }

  // Search Wiki Commons
  if (sources.includes('all') || sources.includes('wikiCommons')) {
    try {
      const wikiResult = await searchWikiCommons(query, page, perPage);
      allImages.push(...wikiResult.images);
      if (wikiResult.hasMore) hasMore = true;
    } catch (error) {
      console.error('❌ Wiki Commons search error:', error);
    }
  }

  // Search Google Custom Search (Internet)
  if (sources.includes('all') || sources.includes('internet')) {
    try {
      const googleResult = await searchGoogleCustomSearch(query, page, perPage);
      allImages.push(...googleResult.images);
      if (googleResult.hasMore) hasMore = true;
    } catch (error) {
      console.error('❌ Google Custom Search error:', error);
    }
  }

  return { images: allImages, hasMore };
}

async function searchUnsplash(query: string, page: number, perPage: number) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.log('❌ [SEARCH DEBUG] No Unsplash access key found');
    return { images: [], hasMore: false };
  }

  console.log('🔍 [SEARCH DEBUG] Searching Unsplash for:', query);
  
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${accessKey}`
  );

  if (!response.ok) {
    console.log('❌ [SEARCH DEBUG] Unsplash API error:', response.status, response.statusText);
    return { images: [], hasMore: false };
  }

  const data = await response.json();
  console.log('📊 [SEARCH DEBUG] Unsplash returned', data.results?.length || 0, 'images');
  
  const images = data.results?.map((photo: any) => {
    // Add UTM parameters to photographer URL for traceback
    const photographerUrl = new URL(photo.user.links.html);
    photographerUrl.searchParams.set('utm_source', 'wordpress-article-editor');
    photographerUrl.searchParams.set('utm_medium', 'referral');
    photographerUrl.searchParams.set('utm_campaign', 'image-attribution');
    
    const imageData = {
      url: photo.urls.small,
      full: photo.urls.full,
      caption: photo.alt_description || photo.description || 'Unsplash Image',
      source: 'unsplash',
      thumbnail: photo.urls.thumb,
      link: photo.links.html,
      photographer: photo.user.name,
      photographerUrl: photographerUrl.toString(),
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      downloadLocation: photo.links.download_location
    };

    // Debug logging for Unsplash images
    console.log('📸 [UNSPLASH SEARCH DEBUG] Image processed:', {
      photographer: imageData.photographer,
      hasDownloadLocation: !!imageData.downloadLocation,
      downloadLocation: imageData.downloadLocation
    });

    return imageData;
  }) || [];

  // Unsplash typically has more results if we got a full page
  const hasMore = images.length === perPage;

  return { images, hasMore };
}

async function searchPexels(query: string, page: number, perPage: number) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return { images: [], hasMore: false };

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': apiKey
      }
    }
  );

  if (!response.ok) return { images: [], hasMore: false };

  const data = await response.json();
  const images = data.photos?.map((photo: any) => ({
    url: photo.src.medium,
    full: photo.src.large2x,
    caption: photo.alt || 'Pexels Image',
    source: 'pexels',
    thumbnail: photo.src.small,
    link: photo.url,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    attribution: `Photo by ${photo.photographer} on Pexels`
  })) || [];

  const hasMore = images.length === perPage;
  return { images, hasMore };
}

async function searchPixabay(query: string, page: number, perPage: number) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    console.log('❌ [SEARCH DEBUG] No Pixabay API key found');
    return { images: [], hasMore: false };
  }

  console.log('🔍 [SEARCH DEBUG] Searching Pixabay for:', query);
  
  // Ensure perPage is within Pixabay's limits (3-200)
  const validPerPage = Math.min(Math.max(perPage, 3), 200);
  
  const response = await fetch(
    `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${validPerPage}&image_type=photo&safesearch=true&order=popular`
  );

  if (!response.ok) {
    console.log('❌ [SEARCH DEBUG] Pixabay API error:', response.status, response.statusText);
    return { images: [], hasMore: false };
  }

  const data = await response.json();
  console.log('📊 [SEARCH DEBUG] Pixabay returned', data.hits?.length || 0, 'images');
  
  const images = data.hits?.map((hit: any) => ({
    url: hit.webformatURL,
    full: hit.largeImageURL || hit.imageURL,
    caption: hit.tags || 'Pixabay Image',
    source: 'pixabay',
    thumbnail: hit.previewURL,
    link: hit.pageURL,
    photographer: hit.user,
    photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
    attribution: `Image by ${hit.user} from Pixabay`,
    imageId: hit.id.toString(),
    width: hit.imageWidth,
    height: hit.imageHeight,
    views: hit.views,
    downloads: hit.downloads,
    likes: hit.likes,
    comments: hit.comments,
    tags: hit.tags
  })) || [];

  const hasMore = images.length === validPerPage;
  return { images, hasMore };
}

async function searchOpenverse(query: string, page: number, perPage: number, source?: string) {
  const clientId = process.env.OPENVERSE_CLIENT_ID;
  const clientSecret = process.env.OPENVERSE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ [SEARCH DEBUG] No Openverse credentials found');
    return { images: [], hasMore: false };
  }

  console.log('🔍 [SEARCH DEBUG] Searching Openverse for:', query, source ? `(source: ${source})` : '');

  try {
    // Get access token
    const accessToken = await getOpenverseAccessToken();
    if (!accessToken) {
      console.log('❌ [SEARCH DEBUG] Failed to get Openverse access token');
      return { images: [], hasMore: false };
    }

    // Build search URL
    const searchUrl = new URL('https://api.openverse.org/v1/images/');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('page', page.toString());
    searchUrl.searchParams.set('page_size', perPage.toString());
    searchUrl.searchParams.set('license', 'cc0,pdm,by,by-sa');
    searchUrl.searchParams.set('category', 'photograph,illustration');
    searchUrl.searchParams.set('filter_dead', 'true');
    searchUrl.searchParams.set('mature', 'false');
    
    // Add source filtering if specified
    if (source) {
      searchUrl.searchParams.set('source', source);
    }

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ [SEARCH DEBUG] Openverse API error:', response.status, response.statusText);
      return { images: [], hasMore: false };
    }

    const data = await response.json();
    console.log('📊 [SEARCH DEBUG] Openverse returned', data.results?.length || 0, 'images');

    const images = data.results?.map((image: any) => {
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
               full: proxyUrl,
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
               tags: image.tags?.map((tag: any) => tag.name) || []
             };
           }) || [];

    const hasMore = images.length === perPage;
    return { images, hasMore };

  } catch (error) {
    console.error('❌ [SEARCH DEBUG] Openverse search error:', error);
    return { images: [], hasMore: false };
  }
}

async function getOpenverseAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.OPENVERSE_CLIENT_ID;
    const clientSecret = process.env.OPENVERSE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
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

// Simple in-memory token cache
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

async function searchWikiCommons(query: string, page: number, perPage: number) {
  
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    // First, search for files
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${perPage}&sroffset=${(page - 1) * perPage}`;
    
    
    const searchResponse = await fetch(searchUrl, { signal: controller.signal });

    clearTimeout(timeoutId);

    

    if (!searchResponse.ok) {
      
      // Return mock data as fallback
      const images = [
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-300)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
          full: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg',
          caption: 'Lion (Panthera leo) male Head',
          source: 'wikiCommons',
          thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-150)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
          attribution: 'Photo by Unknown, via Wikimedia Commons'
        }
      ];
      return { images, hasMore: false };
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];
    
    if (searchResults.length === 0) {
      
      return { images: [], hasMore: false };
    }

    // Get the actual image URLs and metadata for the search results
    const titles = searchResults.map((result: any) => result.title).join('|');
    const imageResponse = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size|mime|extmetadata|thumbmime&iilimit=1&iiurlwidth=300`,
      { signal: controller.signal }
    );

    if (!imageResponse.ok) {
      
      return { images: [], hasMore: false };
    }

    const imageData = await imageResponse.json();
    const pages = imageData.query?.pages || {};
    
    const images = searchResults.map((result: any) => {
      const pageId = result.pageid.toString();
      const pageData = pages[pageId];
      const imageInfo = pageData?.imageinfo?.[0];
      const metadata = imageInfo?.extmetadata || {};
      
      // Use the actual image URL if available, otherwise fallback to the page URL
      const imageUrl = imageInfo?.url || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`;
      
      // Get thumbnail URL (var(--space-300) width) for faster loading in search results
      const thumbnailUrl = imageInfo?.thumburl || imageUrl;
      
      // Extract author/creator information
      const author = metadata.Artist?.value || metadata.Creator?.value || 'Unknown author';
      const license = metadata.LicenseShortName?.value || metadata.License?.value || 'Unknown license';
      
      // Clean up the author name (remove HTML tags and extra formatting)
      const cleanAuthor = author.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      
      // Create attribution string
      const attribution = `Photo by ${cleanAuthor}, via Wikimedia Commons, licensed under ${license}`;
      
      return {
        url: imageUrl,
        full: imageUrl,
        caption: result.title.replace('File:', ''),
        source: 'wikiCommons',
        thumbnail: thumbnailUrl,
        link: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`,
        width: imageInfo?.width || 0,
        height: imageInfo?.height || 0,
        author: cleanAuthor,
        license: license,
        attribution: attribution
      };
    });

    const hasMore = images.length === perPage;
    return { images, hasMore };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      
    } else {
      console.error('❌ Wiki Commons search error:', error);
    }
    // Return mock data as fallback
    const images = [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-300)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
        full: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg',
        caption: 'Lion (Panthera leo) male Head',
        source: 'wikiCommons',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lion_%28Panthera_leo%29_male_Head_01.jpg/var(--space-150)-Lion_%28Panthera_leo%29_male_Head_01.jpg',
        attribution: 'Photo by Unknown, via Wikimedia Commons'
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Lion_waiting_in_Namibia.jpg/var(--space-300)-Lion_waiting_in_Namibia.jpg',
        full: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Lion_waiting_in_Namibia.jpg',
        caption: 'Lion waiting in Namibia',
        source: 'wikiCommons',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Lion_waiting_in_Namibia.jpg/var(--space-150)-Lion_waiting_in_Namibia.jpg',
        attribution: 'Photo by Unknown, via Wikimedia Commons'
      }
    ];

    return { images, hasMore: false };
  }
}

async function searchGoogleCustomSearch(query: string, page: number, perPage: number) {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    console.log('❌ [SEARCH DEBUG] No Google Custom Search credentials found');
    return { images: [], hasMore: false };
  }

  console.log('🔍 [SEARCH DEBUG] Searching Google Custom Search for:', query);
  console.log('🔍 [SEARCH DEBUG] API Key exists:', !!apiKey);
  console.log('🔍 [SEARCH DEBUG] Search Engine ID exists:', !!searchEngineId);
  console.log('🔍 [SEARCH DEBUG] Search Engine ID:', searchEngineId);
  
  // Calculate start index for pagination (Google uses 1-based indexing)
  const startIndex = ((page - 1) * perPage) + 1;
  
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&start=${startIndex}&num=${Math.min(perPage, 10)}&safe=medium`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ [SEARCH DEBUG] Google Custom Search API error:', response.status, response.statusText);
    console.log('❌ [SEARCH DEBUG] Error details:', errorText);
    
    // Return mock internet images as fallback (using proxy)
    console.log('🔄 [SEARCH DEBUG] Returning mock internet images as fallback');
    const randomId1 = Math.floor(Math.random() * 1000);
    const randomId2 = Math.floor(Math.random() * 1000);
    const randomId3 = Math.floor(Math.random() * 1000);
    
    const images = [
      {
        url: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/400/300?random=${randomId1}`)}`,
        full: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/800/600?random=${randomId1}`)}`,
        caption: `Internet Image - ${query}`,
        source: 'internet',
        thumbnail: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/200/150?random=${randomId1}`)}`,
        link: 'https://picsum.photos/',
        photographer: 'Internet',
        photographerUrl: 'https://picsum.photos/',
        attribution: `Image from Internet search for "${query}"`,
        imageId: `internet-${Date.now()}-${randomId1}`,
        width: 400,
        height: 300,
        siteName: 'picsum.photos',
        originalUrl: 'https://picsum.photos/'
      },
      {
        url: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/400/300?random=${randomId2}`)}`,
        full: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/800/600?random=${randomId2}`)}`,
        caption: `Internet Image - ${query}`,
        source: 'internet',
        thumbnail: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/200/150?random=${randomId2}`)}`,
        link: 'https://picsum.photos/',
        photographer: 'Internet',
        photographerUrl: 'https://picsum.photos/',
        attribution: `Image from Internet search for "${query}"`,
        imageId: `internet-${Date.now()}-${randomId2}`,
        width: 400,
        height: 300,
        siteName: 'picsum.photos',
        originalUrl: 'https://picsum.photos/'
      },
      {
        url: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/400/300?random=${randomId3}`)}`,
        full: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/800/600?random=${randomId3}`)}`,
        caption: `Internet Image - ${query}`,
        source: 'internet',
        thumbnail: `/api/proxy-image?url=${encodeURIComponent(`https://picsum.photos/200/150?random=${randomId3}`)}`,
        link: 'https://picsum.photos/',
        photographer: 'Internet',
        photographerUrl: 'https://picsum.photos/',
        attribution: `Image from Internet search for "${query}"`,
        imageId: `internet-${Date.now()}-${randomId3}`,
        width: 400,
        height: 300,
        siteName: 'picsum.photos',
        originalUrl: 'https://picsum.photos/'
      }
    ];

    return { images, hasMore: false };
  }

  const data = await response.json();
  console.log('📊 [SEARCH DEBUG] Google Custom Search returned', data.items?.length || 0, 'images');
  
  const images = data.items?.map((item: any) => {
    // Use proxy for all images to avoid CORS issues
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.link)}`;
    const thumbnailProxyUrl = item.image?.thumbnailLink ? `/api/proxy-image?url=${encodeURIComponent(item.image.thumbnailLink)}` : proxyUrl;
    
    return {
      url: proxyUrl,
      full: proxyUrl,
      caption: item.title || 'Internet Image',
      source: 'internet',
      thumbnail: thumbnailProxyUrl,
      link: item.image?.contextLink || item.link,
      photographer: item.image?.contextLink ? new URL(item.image.contextLink).hostname : 'Internet',
      photographerUrl: item.image?.contextLink || item.link,
      attribution: `Image from ${item.displayLink || 'Internet'}`,
      imageId: item.cacheId || item.link,
      width: item.image?.width || 0,
      height: item.image?.height || 0,
      siteName: item.displayLink,
      originalUrl: item.image?.contextLink
    };
  }) || [];

  // Google Custom Search has a limit of 100 results total, and we can get up to 10 per request
  const hasMore = data.searchInformation?.totalResults ? 
    (parseInt(data.searchInformation.totalResults) > (startIndex + images.length - 1)) : 
    (images.length === Math.min(perPage, 10));

  return { images, hasMore };
}
