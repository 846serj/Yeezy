import { NextRequest, NextResponse } from 'next/server';
import { pixabayRateLimiter, handlePixabayError } from '@/lib/pixabay-rate-limiter';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = Math.min(Math.max(parseInt(searchParams.get('perPage') || '20'), 3), 200); // Min 3, Max 200 per Pixabay API
  const imageType = searchParams.get('imageType') || 'photo';
  const orientation = searchParams.get('orientation') || 'all';
  const category = searchParams.get('category') || '';
  const minWidth = searchParams.get('minWidth') || '0';
  const minHeight = searchParams.get('minHeight') || '0';
  const colors = searchParams.get('colors') || '';
  const editorsChoice = searchParams.get('editorsChoice') === 'true';
  const safesearch = searchParams.get('safesearch') !== 'false'; // Default to true
  const order = searchParams.get('order') || 'popular';
  const lang = searchParams.get('lang') || 'en';

  try {
    const images = await pixabayRateLimiter.makeRequest(() => 
      searchPixabayImages({
        query,
        page,
        perPage,
        imageType,
        orientation,
        category,
        minWidth,
        minHeight,
        colors,
        editorsChoice,
        safesearch,
        order,
        lang
      })
    );
    
    return NextResponse.json({
      images,
      hasMore: images.length === perPage,
      page,
      total: images.length
    });
  } catch (error) {
    console.error('❌ Pixabay search error:', error);
    
    return NextResponse.json({
      images: [],
      hasMore: false,
      page: 1,
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to search Pixabay images'
    }, { status: 500 });
  }
}

interface PixabaySearchParams {
  query: string;
  page: number;
  perPage: number;
  imageType: string;
  orientation: string;
  category: string;
  minWidth: string;
  minHeight: string;
  colors: string;
  editorsChoice: boolean;
  safesearch: boolean;
  order: string;
  lang: string;
}

async function searchPixabayImages(params: PixabaySearchParams) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    console.log('❌ [PIXABAY DEBUG] No Pixabay API key found');
    return [];
  }

  console.log('🔍 [PIXABAY DEBUG] Searching Pixabay for:', params.query);
  
  // Build query parameters
  const searchParams = new URLSearchParams({
    key: apiKey,
    q: params.query,
    page: params.page.toString(),
    per_page: params.perPage.toString(),
    image_type: params.imageType,
    orientation: params.orientation,
    order: params.order,
    safesearch: params.safesearch.toString(),
    lang: params.lang
  });

  // Add optional parameters
  if (params.category) searchParams.append('category', params.category);
  if (params.minWidth !== '0') searchParams.append('min_width', params.minWidth);
  if (params.minHeight !== '0') searchParams.append('min_height', params.minHeight);
  if (params.colors) searchParams.append('colors', params.colors);
  if (params.editorsChoice) searchParams.append('editors_choice', 'true');

  const response = await fetch(`https://pixabay.com/api/?${searchParams.toString()}`);

  // Update rate limit info from response headers
  pixabayRateLimiter.updateRateLimit(response.headers);

  if (!response.ok) {
    console.log('❌ [PIXABAY DEBUG] Pixabay API error:', response.status, response.statusText);
    
    // Check for rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log('⏰ [PIXABAY DEBUG] Rate limited. Retry after:', retryAfter);
    }
    
    throw await handlePixabayError({ status: response.status }, 'Image search');
  }

  const data = await response.json();
  console.log('📊 [PIXABAY DEBUG] Pixabay returned', data.hits?.length || 0, 'images');
  
  return data.hits?.map((hit: any) => ({
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
    tags: hit.tags,
    // Store additional URLs for different sizes
    webformatURL: hit.webformatURL,
    largeImageURL: hit.largeImageURL,
    fullHDURL: hit.fullHDURL,
    imageURL: hit.imageURL,
    vectorURL: hit.vectorURL
  })) || [];
}
