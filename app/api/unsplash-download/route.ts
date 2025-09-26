import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { downloadLocation } = await request.json();

    if (!downloadLocation) {
      return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: 'Unsplash access key not configured' }, { status: 500 });
    }

    // Trigger the download tracking endpoint asynchronously
    // This increments the download counter for the photographer
    const response = await fetch(downloadLocation, {
      method: 'GET',
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to trigger Unsplash download tracking:', response.status, response.statusText);
      // Don't fail the request if tracking fails - this is just for analytics
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering Unsplash download tracking:', error);
    // Don't fail the request if tracking fails - this is just for analytics
    return NextResponse.json({ success: true });
  }
}
