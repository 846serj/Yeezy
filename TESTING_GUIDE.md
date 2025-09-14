# WordPress Editor V3 Testing Guide

## 🚀 How to Test the New WordPress-Compatible Editor

### 1. **Start the Development Server**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### 2. **Test the New Editor Features**

#### **Option A: Test Editor (Purple "Test" Button)**
- Click the purple **"Test"** button in the header when viewing articles
- This opens the `WordPressEditorExample` component
- Features to test:
  - **Connect to WordPress** (if not already connected)
  - **Edit content element by element** - click any paragraph or heading
  - **Add images** using the "Add Image" buttons
  - **Parse content** to see structured elements
  - **Save to WordPress** with proper formatting

#### **Option B: New V3 Editor (Green "New V3" Button)**
- Click the green **"New V3"** button to create a new article
- This opens the `ArticleEditorV3` component
- Features to test:
  - **Element-by-element editing** - click any content element
  - **Image editing** - click on images to edit them
  - **Settings panel** - click "Settings" to access categories, tags, etc.
  - **Featured image upload**
  - **WordPress-compatible saving**

### 3. **What to Look For**

#### **WordPress Compatibility Features:**
- ✅ **Gutenberg block classes** (`wp-block-image`, `wp-block-paragraph`, etc.)
- ✅ **Proper image structure** with `<figure>` and `<figcaption>`
- ✅ **Semantic HTML** that works with WordPress themes
- ✅ **Automatic image upload** to WordPress media library
- ✅ **Base64 image processing** and replacement

#### **User Experience Features:**
- ✅ **Click to edit** any element directly
- ✅ **Hover effects** showing edit buttons and element types
- ✅ **Visual feedback** with tag badges and hover states
- ✅ **Keyboard shortcuts** (Ctrl+Enter to save, Escape to cancel)
- ✅ **Smart image insertion** after headings

### 4. **Test Scenarios**

#### **Scenario 1: Basic Content Editing**
1. Create a new article with "New V3"
2. Add a heading and some paragraphs
3. Click on each element to edit them
4. Save and check the generated HTML

#### **Scenario 2: Image Management**
1. Add an image after a heading
2. Click on the image to edit it
3. Upload a new image
4. Check that it gets proper WordPress classes

#### **Scenario 3: WordPress Integration**
1. Connect to a real WordPress site
2. Create content with the editor
3. Save to WordPress
4. Check the post in WordPress admin to see the proper formatting

### 5. **Expected Output**

When you save content, it should generate WordPress-compatible HTML like:

```html
<figure class="wp-block-image size-large">
  <img src="https://yoursite.com/wp-content/uploads/2024/01/image.jpg" 
       alt="Image description" 
       class="wp-image-123"
       width="1280" height="720" />
  <figcaption>Image caption</figcaption>
</figure>

<p class="wp-block-paragraph">Your paragraph content here.</p>

<h2 class="wp-block-heading">Your heading here</h2>
```

### 6. **Troubleshooting**

#### **If you see errors:**
- Check the browser console for any JavaScript errors
- Make sure you're connected to WordPress before testing save functionality
- Verify that the WordPress site has proper REST API access

#### **If images don't upload:**
- Check that your WordPress site has proper media upload permissions
- Verify the application password is correct
- Check the network tab for any failed requests

### 7. **Development Notes**

- The new editor uses structured content editing (element-by-element)
- All content is converted to WordPress-compatible HTML before saving
- Images are automatically uploaded to WordPress media library
- The system adds proper WordPress classes for theme compatibility

## 🎯 Success Criteria

The test is successful if:
- ✅ You can edit content element by element
- ✅ Images are properly uploaded and formatted
- ✅ Generated HTML has WordPress-compatible structure
- ✅ Content saves successfully to WordPress
- ✅ Saved content displays correctly in WordPress admin
