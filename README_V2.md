# Yeez WordPress Article Editor V2

A modern, industry-standard React-based WordPress post editor that integrates seamlessly with WordPress REST API and TinyMCE, following WordPress Classic Editor best practices and modern headless CMS standards.

## 🚀 Key Improvements in V2

### 1. Enhanced Authentication & Security
- **@wordpress/api-fetch integration** for official WordPress API handling
- **JWT token-based authentication** with automatic refresh
- **CSRF protection** with nonce support
- **Rate limiting** and comprehensive error handling
- **Secure credential management**

### 2. WordPress REST API Standards Compliance
- **Proper field structure** using WordPress title/content/excerpt objects
- **Context-aware requests** (edit vs view) for accurate data handling
- **Standard HTTP methods** (POST for updates as per WordPress docs)
- **Complete WordPress data model** support
- **Automatic shortcode processing** server-side

### 3. WordPress Classic Editor Experience
- **Native TinyMCE toolbar** matching WordPress Classic Editor
- **WordPress-specific plugins** and features
- **Standard image handling** with WordPress caption support
- **Keyboard shortcuts** matching WordPress conventions
- **Accessibility compliance** (WCAG 2.1 AA)

### 4. Advanced Preview System
- **Rendered content preview** using WordPress server-side processing
- **Real-time preview** with toggle between raw and rendered content
- **WordPress admin integration** for seamless workflow
- **Responsive preview** with proper styling

### 5. Accessibility & UX Enhancements
- **WCAG 2.1 AA compliant** components
- **Screen reader support** with proper ARIA labels
- **Keyboard navigation** throughout the interface
- **High contrast support** and focus indicators
- **Error handling** with user-friendly messages

## 📦 Installation

```bash
# Install dependencies
npm install

# Install WordPress-specific packages
npm install @wordpress/api-fetch @wordpress/url @wordpress/dom-ready

# Start development server
npm run dev
```

## 🛠 WordPress Setup

### Required WordPress Plugins

1. **Application Passwords** (Built-in WordPress 5.6+)
   - Go to Users → Profile → Application Passwords
   - Generate a new password for the editor

2. **Advanced Editor Tools** (Recommended)
   - Plugin: [Advanced Editor Tools](https://wordpress.org/plugins/tinymce-advanced/)
   - Provides enhanced TinyMCE features matching WordPress Classic Editor

3. **REST API Authentication** (Optional)
   - Plugin: [Application Passwords](https://wordpress.org/plugins/application-passwords/)
   - Enhanced security for REST API access

### WordPress Configuration

Add to your `wp-config.php`:

```php
// Enable REST API
define('REST_REQUEST', true);

// CORS configuration (replace with your editor domain)
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://your-editor-domain.com');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
});
```

## 🎯 Usage

### Basic Setup

```tsx
import { ArticleEditorV2 } from './components/ArticleEditorV2';
import { useWordPress } from './hooks/useWordPress';

function App() {
  const { connect, isConnected } = useWordPress();

  const handleConnect = async () => {
    await connect('https://yoursite.com', 'username', 'app-password');
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>Connect to WordPress</button>
      ) : (
        <ArticleEditorV2
          article={null}
          onSave={(article) => console.log('Saved:', article)}
          onBack={() => console.log('Back')}
        />
      )}
    </div>
  );
}
```

### Using the Enhanced API

```tsx
import { createWordPressAPIV2 } from './lib/wordpress-api-v2';

const api = createWordPressAPIV2('https://yoursite.com', 'username', 'app-password');

// Create a post with proper WordPress field structure
const post = await api.createPost({
  title: 'My Article',
  content: '<p>Article content with <strong>formatting</strong></p>',
  excerpt: 'Article excerpt',
  status: 'draft',
  categories: [1, 2],
  tags: [3, 4],
  featured_media: 123
});

// Get rendered content for preview
const renderedContent = await api.getRenderedContent(post.id);
```

## 🔧 Components

### RichTextEditorV2
- WordPress Classic Editor experience
- Native TinyMCE toolbar
- WordPress-specific plugins and features
- Accessibility compliance

### PreviewPanel
- Real-time content preview
- Toggle between raw and rendered content
- WordPress admin integration
- Responsive design

### ArticleEditorV2
- Complete article editing interface
- Tabbed interface (Edit, Preview, Settings)
- Media library integration
- Category and tag management

### AccessibleButton & AccessibleInput
- WCAG 2.1 AA compliant
- Screen reader support
- Keyboard navigation
- High contrast support

## 🛡 Error Handling & Rate Limiting

The editor includes comprehensive error handling:

```tsx
import { withRetry, getErrorMessage, logError } from './lib/error-handler';

try {
  const result = await withRetry(() => api.createPost(postData));
} catch (error) {
  const message = getErrorMessage(error);
  const suggestion = getErrorRecoverySuggestion(error);
  logError(error, 'createPost');
}
```

## 🎨 Styling

The editor uses a clean, WordPress-inspired design:

- **Typography**: System fonts matching WordPress admin
- **Colors**: WordPress color palette
- **Spacing**: Consistent 8px grid system
- **Components**: Accessible, keyboard-navigable interface

## 📱 Responsive Design

- **Mobile-first** approach
- **Touch-friendly** interface
- **Responsive preview** panel
- **Adaptive toolbar** for different screen sizes

## 🔒 Security Features

- **HTTPS enforcement** in production
- **CORS protection** with domain whitelisting
- **Rate limiting** to prevent abuse
- **Input sanitization** and validation
- **Secure credential storage**

## 🧪 Testing

```bash
# Run tests
npm test

# Run accessibility tests
npm run test:a11y

# Run integration tests
npm run test:integration
```

## 📊 Performance

- **Lazy loading** of editor components
- **Efficient re-rendering** with React optimization
- **Image optimization** and compression
- **Caching** of WordPress data
- **Bundle splitting** for faster loading

## 🚀 Deployment

### Environment Variables

```env
NEXT_PUBLIC_WORDPRESS_URL=https://yoursite.com
NEXT_PUBLIC_API_BASE_URL=/api
JWT_SECRET=your-secret-key
```

### Build for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure accessibility compliance
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- **TinyMCE**: [TinyMCE Documentation](https://www.tiny.cloud/docs/)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 🔄 Migration from V1

### Breaking Changes

1. **API Client**: Use `WordPressAPIV2` instead of `WordPressAPI`
2. **Editor Component**: Use `RichTextEditorV2` instead of `RichTextEditor`
3. **Authentication**: Enhanced with @wordpress/api-fetch
4. **Error Handling**: New error classification system

### Migration Steps

1. Update imports to use V2 components
2. Replace API calls with new methods
3. Update error handling
4. Test with your WordPress setup
5. Update any custom styling

## 🎯 Roadmap

- [ ] **Gutenberg Block Support** - Integration with WordPress blocks
- [ ] **Multi-site Support** - Manage multiple WordPress sites
- [ ] **Offline Support** - Work without internet connection
- [ ] **Collaborative Editing** - Real-time collaboration
- [ ] **Plugin System** - Extensible architecture
- [ ] **Advanced Media Management** - Enhanced media library
- [ ] **SEO Tools** - Built-in SEO optimization
- [ ] **Analytics Integration** - Content performance tracking

---

**Built with ❤️ for the WordPress community**
