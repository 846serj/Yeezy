import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const sources = searchParams.get('sources')?.split(',') || ['all'];
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!query) {
      return NextResponse.json({ images: [], hasMore: false });
    }

    const images = await searchImages(query, sources, page, perPage);
    
    return NextResponse.json({
      images,
      hasMore: images.length === perPage,
      page
    });

  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json({ error: 'Failed to search images' }, { status: 500 });
  }
}

async function searchImages(query: string, sources: string[], page: number, perPage: number) {
  const allImages: any[] = [];
  
  // Search Unsplash
  if (sources.includes('all') || sources.includes('unsplash')) {
    try {
      const unsplashImages = await searchUnsplash(query, page, perPage);
      allImages.push(...unsplashImages);
    } catch (error) {
      console.error('Unsplash search error:', error);
    }
  }

  // Search Pexels
  if (sources.includes('all') || sources.includes('pexels')) {
    try {
      const pexelsImages = await searchPexels(query, page, perPage);
      allImages.push(...pexelsImages);
    } catch (error) {
      console.error('Pexels search error:', error);
    }
  }

  // Search Wiki Commons
  if (sources.includes('all') || sources.includes('wikiCommons')) {
    try {
      const wikiImages = await searchWikiCommons(query, page, perPage);
      allImages.push(...wikiImages);
    } catch (error) {
      console.error('Wiki Commons search error:', error);
    }
  }

  return allImages.slice(0, perPage);
}

async function searchUnsplash(query: string, page: number, perPage: number) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${accessKey}`
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.results.map((photo: any) => ({
    url: photo.urls.small,
    full: photo.urls.full,
    caption: photo.alt_description || photo.description || 'Unsplash Image',
    source: 'unsplash',
    thumbnail: photo.urls.thumb,
    link: photo.links.html,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    attribution: `Photo by ${photo.user.name} on Unsplash`
  }));
}

async function searchPexels(query: string, page: number, perPage: number) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': apiKey
      }
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return data.photos.map((photo: any) => ({
    url: photo.src.medium,
    full: photo.src.large2x,
    caption: photo.alt || 'Pexels Image',
    source: 'pexels',
    thumbnail: photo.src.small,
    link: photo.url,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    attribution: `Photo by ${photo.photographer} on Pexels`
  }));
}

async function searchWikiCommons(query: string, page: number, perPage: number) {
  // First, search for files
  const searchResponse = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${perPage}&sroffset=${(page - 1) * perPage}`
  );

  if (!searchResponse.ok) return [];

  const searchData = await searchResponse.json();
  const searchResults = searchData.query?.search || [];
  
  if (searchResults.length === 0) return [];

  // Get the actual image URLs and metadata for the search results
  const titles = searchResults.map((result: any) => result.title).join('|');
  const imageResponse = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size|mime|extmetadata|thumbmime&iilimit=1&iiurlwidth=300`
  );

  if (!imageResponse.ok) return [];

  const imageData = await imageResponse.json();
  const pages = imageData.query?.pages || {};
  
  return searchResults.map((result: any) => {
    const pageId = result.pageid.toString();
    const pageData = pages[pageId];
    const imageInfo = pageData?.imageinfo?.[0];
    const metadata = imageInfo?.extmetadata || {};
    
    // Use the actual image URL if available, otherwise fallback to the page URL
    const imageUrl = imageInfo?.url || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(result.title)}`;
    
    // Get thumbnail URL (300px width) for faster loading in search results
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
}
