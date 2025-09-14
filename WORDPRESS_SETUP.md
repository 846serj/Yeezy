# WordPress Setup Guide for Yeez Article Editor

This guide helps you set up your WordPress site to work optimally with the Yeez Article Editor, following WordPress best practices and industry standards.

## Required WordPress Plugins

### 1. Application Passwords (Built-in)
- **Status**: Included in WordPress 5.6+
- **Purpose**: Secure API authentication
- **Setup**: Go to Users → Profile → Application Passwords
- **Note**: Generate a new password for the Yeez editor

### 2. Advanced Editor Tools (Recommended)
- **Plugin**: [Advanced Editor Tools](https://wordpress.org/plugins/tinymce-advanced/)
- **Purpose**: Enhanced TinyMCE features matching WordPress Classic Editor
- **Features**: 
  - Additional toolbar buttons
  - Font family and size controls
  - Table editing tools
  - WordPress-specific shortcode support

### 3. REST API Authentication (Optional but Recommended)
- **Plugin**: [Application Passwords](https://wordpress.org/plugins/application-passwords/) (if not built-in)
- **Purpose**: Enhanced security for REST API access
- **Features**: Rate limiting, IP restrictions, token management

### 4. WordPress REST API (Built-in)
- **Status**: Core WordPress feature
- **Purpose**: API endpoints for the editor
- **Verification**: Visit `yoursite.com/wp-json/wp/v2/` to confirm it's working

## WordPress Configuration

### 1. Enable REST API
Add to your `wp-config.php`:
```php
// Enable REST API
define('REST_REQUEST', true);

// Allow CORS for your editor domain (replace with your actual domain)
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

### 2. User Permissions
Ensure your WordPress user has:
- **Editor** or **Administrator** role
- **Edit posts** capability
- **Upload files** capability
- **Manage categories** and **Manage tags** capabilities

### 3. Media Settings
- **Upload Directory**: Default (`/wp-content/uploads/`)
- **File Size Limit**: Increase if needed (default is 2MB)
- **Allowed File Types**: Ensure images are enabled

## Custom Post Types (Optional)

If you want to support custom post types, add this to your theme's `functions.php`:

```php
// Register custom post type with REST API support
function register_custom_post_type() {
    register_post_type('custom_article', array(
        'labels' => array(
            'name' => 'Custom Articles',
            'singular_name' => 'Custom Article'
        ),
        'public' => true,
        'show_in_rest' => true, // Important: enables REST API
        'supports' => array('title', 'editor', 'excerpt', 'thumbnail', 'custom-fields'),
        'has_archive' => true,
        'rewrite' => array('slug' => 'custom-articles'),
    ));
}
add_action('init', 'register_custom_post_type');
```

## Security Enhancements

### 1. Rate Limiting
Add to your theme's `functions.php`:
```php
// Basic rate limiting for REST API
function rest_api_rate_limit() {
    $ip = $_SERVER['REMOTE_ADDR'];
    $key = 'rest_api_requests_' . $ip;
    $requests = get_transient($key);
    
    if ($requests === false) {
        set_transient($key, 1, 60); // 1 minute
    } elseif ($requests >= 100) { // 100 requests per minute
        wp_die('Rate limit exceeded', 'Rate Limit', array('response' => 429));
    } else {
        set_transient($key, $requests + 1, 60);
    }
}
add_action('rest_api_init', 'rest_api_rate_limit');
```

### 2. CORS Configuration
For production, configure proper CORS headers:
```php
// Add to wp-config.php
define('REST_API_CORS_ORIGINS', 'https://your-editor-domain.com');
```

## Performance Optimization

### 1. Caching
- Install a caching plugin (WP Rocket, W3 Total Cache, etc.)
- Configure REST API caching if needed

### 2. Image Optimization
- Install an image optimization plugin (Smush, ShortPixel, etc.)
- Enable WebP support for better performance

### 3. Database Optimization
- Regular database cleanup
- Optimize database tables

## Troubleshooting

### Common Issues

1. **"REST API not available"**
   - Check if REST API is enabled
   - Verify permalink structure (not "Plain")
   - Check for plugin conflicts

2. **"Authentication failed"**
   - Verify application password is correct
   - Check user permissions
   - Ensure HTTPS is working properly

3. **"CORS error"**
   - Add proper CORS headers
   - Check domain configuration
   - Verify SSL certificates

4. **"Image upload failed"**
   - Check file size limits
   - Verify upload directory permissions
   - Check allowed file types

### Debug Mode
Enable WordPress debug mode to troubleshoot issues:
```php
// Add to wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

## Testing Your Setup

1. **Test REST API**: Visit `yoursite.com/wp-json/wp/v2/`
2. **Test Authentication**: Try creating a post via REST API
3. **Test Media Upload**: Upload an image via REST API
4. **Test Preview**: Verify rendered content displays correctly

## Support

For additional help:
- WordPress REST API Handbook: https://developer.wordpress.org/rest-api/
- TinyMCE Documentation: https://www.tiny.cloud/docs/
- WordPress Support Forums: https://wordpress.org/support/

## Security Checklist

- [ ] Application passwords enabled
- [ ] User has appropriate permissions
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] HTTPS enabled
- [ ] Regular security updates
- [ ] Backup strategy in place
