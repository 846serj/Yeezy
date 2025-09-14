# WordPress Article Editor

A modern, responsive web application for editing WordPress articles using the official WordPress REST API. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Secure Authentication** - Uses WordPress Application Passwords
- 📝 **Rich Text Editor** - TinyMCE integration with custom toolbar
- 🖼️ **Media Management** - Upload and manage images with drag & drop
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔍 **Search & Filter** - Find articles quickly with search and status filters
- 📄 **Article Management** - Create, edit, update, and delete articles
- 🏷️ **Categories & Tags** - Full support for WordPress taxonomies
- ⚡ **Real-time Updates** - Auto-save and live preview
- 🎨 **Modern UI** - Clean, intuitive interface

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Editor**: TinyMCE 6
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A WordPress site with REST API enabled

### Installation

1. Navigate to the project directory:
```bash
cd wordpress-article-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Test

1. **Start the app**: Run `npm run dev` and visit `http://localhost:3000`
2. **Connect to WordPress**: Enter your WordPress site details
3. **Edit articles**: Browse and edit your WordPress articles
4. **Rich text editing**: Use the editor with full formatting capabilities

### WordPress Setup

1. **Enable REST API** (usually enabled by default in WordPress 5.0+)
2. **Create Application Password**:
   - Log into your WordPress admin dashboard
   - Go to Users → Profile
   - Scroll down to "Application Passwords"
   - Enter a name for this app (e.g., "Article Editor")
   - Click "Add New Application Password"
   - Copy the generated password (it won't be shown again)

3. **Configure CORS** (if needed):
   Add this to your WordPress `functions.php` file:
   ```php
   add_action('rest_api_init', function() {
       remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
       add_filter('rest_pre_serve_request', function($value) {
           header('Access-Control-Allow-Origin: *');
           header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
           header('Access-Control-Allow-Headers: Authorization, Content-Type');
           return $value;
       });
   });
   ```

## Usage

### Connecting to WordPress

1. Enter your WordPress site URL (e.g., https://yoursite.com)
2. Enter your WordPress username
3. Enter the Application Password you generated
4. Click "Connect to WordPress"

### Editing Articles

1. **View Articles**: Browse all your articles with search and filter options
2. **Create New**: Click "New Article" to create a new post
3. **Edit Existing**: Click on any article to edit it
4. **Rich Text Editing**: Use the toolbar for formatting, links, images, etc.
5. **Media Management**: Upload images with drag & drop or select from library
6. **Save/Publish**: Save as draft or publish immediately

### Features

- **Auto-save**: Changes are saved automatically every 30 seconds
- **Live Preview**: See how your article will look on the website
- **Image Optimization**: Large images are automatically optimized
- **Keyboard Shortcuts**: Use Ctrl+B for bold, Ctrl+I for italic, etc.
- **Mobile Responsive**: Edit articles on any device

## API Endpoints Used

The application uses the official WordPress REST API endpoints:

- `GET /wp-json/wp/v2/posts` - List posts
- `GET /wp-json/wp/v2/posts/{id}` - Get single post
- `POST /wp-json/wp/v2/posts` - Create post
- `PUT /wp-json/wp/v2/posts/{id}` - Update post
- `DELETE /wp-json/wp/v2/posts/{id}` - Delete post
- `GET /wp-json/wp/v2/media` - List media
- `POST /wp-json/wp/v2/media` - Upload media
- `GET /wp-json/wp/v2/categories` - List categories
- `GET /wp-json/wp/v2/tags` - List tags

## Security

- Uses WordPress Application Passwords for secure authentication
- All API requests are made over HTTPS
- No credentials are stored in the browser
- CORS is properly configured for security

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the WordPress REST API documentation
2. Verify your WordPress site is up to date
3. Ensure Application Passwords are enabled
4. Check browser console for error messages

## Roadmap

- [ ] Multi-site support
- [ ] Bulk operations
- [ ] Custom post types
- [ ] Advanced media management
- [ ] Offline support
- [ ] Plugin compatibility
- [ ] Theme preview
- [ ] SEO optimization tools
