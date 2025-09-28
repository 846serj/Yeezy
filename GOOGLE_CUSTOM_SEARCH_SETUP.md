# Google Custom Search API Setup Guide

This guide will help you set up Google Custom Search API for internet image search in your WordPress Article Editor.

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Custom Search API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click on it and press "Enable"

## Step 2: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (you'll need this for `GOOGLE_CUSTOM_SEARCH_API_KEY`)

## Step 3: Create Custom Search Engine

1. Go to [Google Custom Search Engine](https://cse.google.com/cse/)
2. Click "Add" to create a new search engine
3. In "Sites to search", enter: `*` (this allows searching the entire web)
4. Click "Create"
5. Go to "Setup" > "Basics" and copy the **Search engine ID** (you'll need this for `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`)

## Step 4: Configure Search Engine for Images

1. In your Custom Search Engine settings, go to "Setup" > "Advanced"
2. Under "Image search", check "Enable Image Search"
3. Under "SafeSearch", select "Medium" or "Strict" as appropriate
4. Save your changes

## Step 5: Set Environment Variables

Add these to your `.env.local` file:

```bash
# Google Custom Search API (for internet image search)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_actual_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_actual_search_engine_id_here
```

## Step 6: Test the Integration

1. Restart your development server
2. Open the image search modal in your editor
3. Select "Internet" as a source
4. Search for any term (e.g., "sunset", "cat", "landscape")
5. You should see images from across the internet

## API Limits and Pricing

- **Free Tier**: 100 searches per day
- **Paid Tier**: $5 per 1,000 queries (after free tier)
- **Rate Limits**: 10,000 queries per day maximum

## Troubleshooting

### Common Issues:

1. **"No Google Custom Search credentials found"**
   - Check that your environment variables are set correctly
   - Restart your development server after adding the variables

2. **"Google Custom Search API error: 403"**
   - Verify your API key is correct
   - Ensure the Custom Search API is enabled in your Google Cloud project

3. **"Google Custom Search API error: 400"**
   - Check that your Search Engine ID is correct
   - Ensure your search engine is configured for image search

4. **No results returned**
   - Verify your search engine is set to search the entire web (`*`)
   - Check that image search is enabled in your search engine settings

### Testing Your Setup:

You can test your API key and search engine ID by making a direct request:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=test&searchType=image&num=1"
```

## Security Notes

- Never commit your API keys to version control
- Use environment variables for all sensitive data
- Consider setting up API key restrictions in Google Cloud Console
- Monitor your API usage to avoid unexpected charges

## Features Included

The Google Custom Search integration includes:

- ✅ Web-wide image search
- ✅ Pagination support
- ✅ Image thumbnails and full-size URLs
- ✅ Source attribution (website name)
- ✅ Safe search filtering
- ✅ Medium-sized images by default
- ✅ Photo type filtering (excludes drawings, etc.)

Your "Internet" search option is now ready to use! 🎉
