# Openverse API Integration

This document describes the integration of the Openverse API for openly-licensed media search in the WordPress Article Editor.

## Overview

Openverse is a search engine for openly-licensed media that provides access to millions of freely usable images, audio, and other media. The integration allows users to search and use openly-licensed content with proper attribution.

## Features

- **Image Search**: Search for openly-licensed images from multiple sources
- **OAuth2 Authentication**: Secure API access with client credentials flow
- **Rate Limiting**: Built-in rate limiting and token caching
- **Attribution Support**: Automatic attribution generation for compliance
- **Thumbnail Support**: Thumbnail images for preview and full-size images for use
- **License Information**: Display license details and requirements

## API Setup

### 1. Register Application

You need to make a POST request to register your application. Here are a few ways to do this:

#### Option A: Using curl (Terminal)
```bash
curl -X POST https://api.openverse.org/v1/auth_tokens/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "WordPress Article Editor",
    "description": "A WordPress article editor that allows users to search and use openly-licensed images from Openverse for their articles. The application will display proper attribution and respect license terms.",
    "email": "your-email@example.com"
  }'
```

#### Option B: Using a REST client (Postman, Insomnia, etc.)
- **Method**: POST
- **URL**: `https://api.openverse.org/v1/auth_tokens/register/`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "name": "WordPress Article Editor",
    "description": "A WordPress article editor that allows users to search and use openly-licensed images from Openverse for their articles. The application will display proper attribution and respect license terms.",
    "email": "your-email@example.com"
  }
  ```

#### Option C: Using a simple HTML form
Create a temporary HTML file and open it in your browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Openverse Registration</title>
</head>
<body>
    <h2>Openverse API Registration</h2>
    <form id="registrationForm">
        <div>
            <label for="name">Application Name:</label><br>
            <input type="text" id="name" value="WordPress Article Editor" required>
        </div><br>
        <div>
            <label for="description">Description:</label><br>
            <textarea id="description" rows="4" cols="50" required>A WordPress article editor that allows users to search and use openly-licensed images from Openverse for their articles. The application will display proper attribution and respect license terms.</textarea>
        </div><br>
        <div>
            <label for="email">Email:</label><br>
            <input type="email" id="email" required>
        </div><br>
        <button type="submit">Register Application</button>
    </form>

    <script>
        document.getElementById('registrationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                email: document.getElementById('email').value
            };
            
            try {
                const response = await fetch('https://api.openverse.org/v1/auth_tokens/register/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert(`Registration successful!\n\nClient ID: ${result.client_id}\nClient Secret: ${result.client_secret}\n\nPlease save these credentials securely!`);
                    console.log('Registration result:', result);
                } else {
                    alert(`Registration failed: ${result.detail || 'Unknown error'}`);
                    console.error('Registration error:', result);
                }
            } catch (error) {
                alert(`Network error: ${error.message}`);
                console.error('Network error:', error);
            }
        });
    </script>
</body>
</html>
```

#### After Registration:
1. **Save your credentials**: You'll receive a `client_id` and `client_secret` - save these securely!
2. **Verify your email**: Check your email and click the verification link
3. **Add to environment**: Add the credentials to your `.env.local` file

### 2. Environment Variables

Add the following to your `.env.local` file:

```env
# Openverse API Credentials
OPENVERSE_CLIENT_ID=your_client_id_here
OPENVERSE_CLIENT_SECRET=your_client_secret_here
```

## API Endpoints

### Search Images
- **Endpoint**: `/api/openverse-search`
- **Method**: GET
- **Parameters**:
  - `query` (required): Search term
  - `page` (optional): Page number (default: 1)
  - `perPage` (optional): Results per page (default: 20, max: 20)
  - `license` (optional): License filter (default: cc0,pdm,by,by-sa)
  - `category` (optional): Category filter (default: photograph,illustration)

### Example Request
```bash
curl "http://localhost:3000/api/openverse-search?query=nature&page=1&perPage=10"
```

## Integration Points

### 1. ImageSearchModal
- Added "Openverse API" as a selectable source
- Integrated with existing source selection logic
- Supports attribution display for Openverse images

### 2. BlockInserter
- Added Openverse button to source selection
- Included in default selected sources
- Maintains consistent styling with other sources

### 3. WordPressBlockEditor
- Added Openverse to featured image search
- Integrated with inline image search
- Updated attribution logic for Openverse images

### 4. useImageSearch Hook
- Added Openverse to default selected sources
- Integrated with search functionality

## Data Structure

### ImageResult Interface
```typescript
interface ImageResult {
  url: string;                    // Image URL
  full: string;                   // Full-size image URL
  caption: string;                // Image title/description
  source: 'openverse';           // Source identifier
  thumbnail: string;              // Thumbnail URL
  link: string;                   // Original source URL
  photographer: string;           // Creator name
  photographerUrl: string;        // Creator profile URL
  attribution: string;            // Attribution text
  imageId: string;                // Unique identifier
  width: number;                  // Image width
  height: number;                 // Image height
  license: string;                // License type
  licenseUrl: string;             // License URL
  provider: string;               // Provider name
  category: string;               // Image category
  tags: string[];                 // Image tags
}
```

## Authentication Flow

1. **Token Request**: Application requests access token using client credentials
2. **Token Caching**: Tokens are cached in memory to avoid repeated requests
3. **Token Refresh**: Tokens are automatically refreshed when expired
4. **API Calls**: All API calls include the Bearer token in Authorization header

## Rate Limiting

- **Anonymous Users**: Limited to basic rate limits
- **Registered Users**: Higher rate limits with authentication
- **Token Caching**: Reduces API calls by caching access tokens
- **Error Handling**: Graceful handling of rate limit exceeded responses

## License Compliance

### Supported Licenses
- **CC0**: Public Domain
- **PDM**: Public Domain Mark
- **BY**: Attribution
- **BY-SA**: Attribution-ShareAlike

### Attribution Requirements
- All Openverse images include proper attribution text
- Creator names and URLs are preserved
- License information is displayed
- Attribution is automatically included in image captions

## Error Handling

### Common Errors
- **401 Unauthorized**: Invalid or expired credentials
- **429 Too Many Requests**: Rate limit exceeded
- **400 Bad Request**: Invalid parameters
- **500 Internal Server Error**: Server-side issues

### Error Responses
```json
{
  "error": "Error message describing the issue"
}
```

## Usage Examples

### Search for Nature Images
```javascript
const response = await fetch('/api/openverse-search?query=nature&perPage=10');
const data = await response.json();
console.log(data.images); // Array of ImageResult objects
```

### Filter by License
```javascript
const response = await fetch('/api/openverse-search?query=landscape&license=cc0,by');
const data = await response.json();
```

### Search by Category
```javascript
const response = await fetch('/api/openverse-search?query=art&category=illustration');
const data = await response.json();
```

## Best Practices

1. **Attribution**: Always include proper attribution when using Openverse images
2. **License Compliance**: Respect the license terms of each image
3. **Rate Limiting**: Implement appropriate delays between requests
4. **Error Handling**: Handle API errors gracefully
5. **Caching**: Cache results when appropriate to reduce API calls

## Troubleshooting

### Common Issues

1. **No Images Returned**
   - Check if credentials are properly set
   - Verify the search query is valid
   - Check if the API is experiencing issues

2. **Authentication Errors**
   - Verify client_id and client_secret are correct
   - Check if the application is verified
   - Ensure credentials are properly set in environment variables

3. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Reduce request frequency
   - Consider upgrading API access level

## Support

- **Openverse Documentation**: https://api.openverse.org/
- **API Status**: Check Openverse status page
- **Community**: Openverse community forums
- **Issues**: Report issues through the project repository

## Changelog

### v1.0.0
- Initial Openverse API integration
- OAuth2 authentication implementation
- Image search functionality
- Attribution support
- Rate limiting and error handling
- Integration with all image search modals
