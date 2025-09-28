# Pixabay API Integration

This document describes the Pixabay API integration for the WordPress Article Editor, providing access to free images from Pixabay.

## Overview

The Pixabay integration includes:
- **Image Search**: Search and retrieve royalty-free images
- **Download Support**: Download images to your server
- **Rate Limiting**: Built-in rate limiting and error handling
- **Attribution**: Proper attribution and photographer links

## API Endpoints

### 1. Image Search
**Endpoint**: `/api/pixabay-search`

**Parameters**:
- `query` (string): Search term (required)
- `page` (number): Page number (default: 1)
- `perPage` (number): Results per page (default: 20, max: 200)
- `imageType` (string): Filter by type - "all", "photo", "illustration", "vector" (default: "all")
- `orientation` (string): Filter by orientation - "all", "horizontal", "vertical" (default: "all")
- `category` (string): Filter by category (optional)
- `minWidth` (number): Minimum image width (default: 0)
- `minHeight` (number): Minimum image height (default: 0)
- `colors` (string): Filter by colors (optional)
- `editorsChoice` (boolean): Editor's choice images only (default: false)
- `safesearch` (boolean): Safe search enabled (default: true)
- `order` (string): Sort order - "popular", "latest" (default: "popular")
- `lang` (string): Language code (default: "en")

**Example**:
```
GET /api/pixabay-search?query=nature&perPage=10&imageType=photo&orientation=horizontal
```

### 2. Image Download
**Endpoint**: `/api/pixabay-download`

**Method**: POST

**Body**:
```json
{
  "imageUrl": "https://cdn.pixabay.com/photo/...",
  "imageId": "12345",
  "photographer": "Photographer Name",
  "photographerUrl": "https://pixabay.com/users/..."
}
```

**Response**:
```json
{
  "success": true,
  "dataUrl": "data:image/jpeg;base64,/9j/4AAQ...",
  "contentType": "image/jpeg",
  "size": 1234567,
  "attribution": "Image by Photographer Name from Pixabay",
  "photographerUrl": "https://pixabay.com/users/..."
}
```

## Rate Limiting

The integration includes built-in rate limiting that:
- Respects Pixabay's 100 requests per 60 seconds limit
- Queues requests when rate limited
- Automatically waits for rate limit reset
- Provides detailed logging of rate limit status

### Rate Limit Headers
- `X-RateLimit-Limit`: Maximum requests per 60 seconds
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets (Unix timestamp)

## Error Handling

The integration handles various error scenarios:

### HTTP Status Codes
- **400**: Invalid request parameters
- **401**: Invalid API key
- **403**: API access forbidden
- **429**: Rate limit exceeded
- **500+**: Pixabay service unavailable

### Error Response Format
```json
{
  "images": [],
  "hasMore": false,
  "page": 1,
  "total": 0,
  "error": "Error message describing the issue"
}
```

## Image Result Format

### Image Search Results
```json
{
  "url": "https://cdn.pixabay.com/photo/..._640.jpg",
  "full": "https://cdn.pixabay.com/photo/..._1280.jpg",
  "caption": "Image description",
  "source": "pixabay",
  "thumbnail": "https://cdn.pixabay.com/photo/..._150.jpg",
  "link": "https://pixabay.com/photos/...",
  "photographer": "Photographer Name",
  "photographerUrl": "https://pixabay.com/users/photographer-123/",
  "attribution": "Image by Photographer Name from Pixabay",
  "imageId": "12345",
  "width": 1920,
  "height": 1080,
  "views": 1234,
  "downloads": 567,
  "likes": 89,
  "comments": 12,
  "tags": "nature, landscape, mountain"
}
```


## Setup Instructions

### 1. Get Pixabay API Key
1. Visit [Pixabay API](https://pixabay.com/api/docs/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Environment Configuration
Add your API key to your environment variables:

```bash
# .env.local
PIXABAY_API_KEY=your_pixabay_api_key_here
```

### 3. Usage in Components
The Pixabay integration is automatically available in the ImageSearchModal component. Users can:
1. Select "Pixabay API" as a source
2. Search for images
3. Click on results to insert them into their articles
4. View proper attribution and photographer links

## Image Sizes Available

Pixabay provides multiple image sizes:
- **previewURL**: 150px max (thumbnail)
- **webformatURL**: 640px max (medium)
- **largeImageURL**: 1280px max (large)
- **fullHDURL**: 1920px max (full HD)
- **imageURL**: Original size (full resolution)


## Attribution Requirements

When using Pixabay images, you must:
1. Show attribution whenever search results are displayed
2. Include photographer name and link to their Pixabay profile
3. Credit Pixabay as the source

The integration automatically handles proper attribution formatting.

## Caching

Images are cached for 24 hours as required by Pixabay's terms of service. The integration respects this requirement and implements appropriate caching strategies.

## Support

For issues with the Pixabay integration:
1. Check the console logs for detailed error messages
2. Verify your API key is correctly configured
3. Ensure you're not exceeding rate limits
4. Check Pixabay's service status

For Pixabay API issues, refer to their [official documentation](https://pixabay.com/api/docs/).
