import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageId, photographer, photographerUrl } = await request.json();
    
    console.log('🔍 [PIXABAY DOWNLOAD DEBUG] Download request received');
    console.log('📍 [PIXABAY DOWNLOAD DEBUG] Image ID:', imageId);
    console.log('📍 [PIXABAY DOWNLOAD DEBUG] Image URL:', imageUrl);
    console.log('📍 [PIXABAY DOWNLOAD DEBUG] Photographer:', photographer);

    if (!imageUrl) {
      console.error('❌ [PIXABAY DOWNLOAD DEBUG] No image URL provided');
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Download the image from Pixabay
    try {
      console.log('🚀 [PIXABAY DOWNLOAD DEBUG] Downloading image from Pixabay...');
      
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        console.error('❌ [PIXABAY DOWNLOAD DEBUG] Failed to download image:', imageResponse.status, imageResponse.statusText);
        return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      console.log('✅ [PIXABAY DOWNLOAD DEBUG] Successfully downloaded image');
      console.log('📊 [PIXABAY DOWNLOAD DEBUG] Image size:', imageBuffer.byteLength, 'bytes');
      console.log('📊 [PIXABAY DOWNLOAD DEBUG] Content type:', contentType);

      // Convert to base64 for response
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return NextResponse.json({ 
        success: true,
        dataUrl,
        contentType,
        size: imageBuffer.byteLength,
        attribution: photographer ? `Image by ${photographer} from Pixabay` : 'Image from Pixabay',
        photographerUrl
      });
    } catch (downloadError) {
      console.error('💥 [PIXABAY DOWNLOAD DEBUG] Error downloading image:', downloadError);
      return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 [PIXABAY DOWNLOAD DEBUG] Error processing download request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
