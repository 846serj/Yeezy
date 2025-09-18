# URL-Based Routing Implementation

## Overview
The WordPress Article Editor now uses URL-based routing instead of client-side state management. This solves the refresh issue and follows industry standards.

## Route Structure

### Main Routes
- `/` - Site selection and authentication
- `/dashboard` - Article list and management
- `/editor` - Create new article
- `/editor/[id]` - Edit existing article (where [id] is the article ID)
- `/generate` - Article generator

### URL Parameters
- `/editor?generated=true&title=...&content=...` - Editor with generated content

## Benefits

1. **Refresh Persistence**: Users stay on the same page when refreshing
2. **Shareable URLs**: Users can bookmark and share specific states
3. **Browser History**: Back/forward buttons work naturally
4. **SEO Friendly**: Search engines can index different states
5. **No State Management**: No need for complex client-side state persistence

## Navigation Flow

1. **Site Selection** (`/`) → **Dashboard** (`/dashboard`) after connection
2. **Dashboard** → **Editor** (`/editor`) for new articles
3. **Dashboard** → **Editor** (`/editor/123`) for existing articles
4. **Dashboard** → **Generate** (`/generate`) for article generation
5. **Generate** → **Editor** with generated content

## Implementation Details

- Each route is a separate Next.js page component
- Authentication and connection state are checked on each page
- Automatic redirects to appropriate pages based on state
- Navigation component provides consistent UI across all pages
- Generated content is passed via URL parameters to the editor

## Migration Notes

- Removed complex client-side state management
- Simplified main page.tsx to only handle site selection
- Each view is now a separate page with its own logic
- No localStorage or sessionStorage needed for state persistence
