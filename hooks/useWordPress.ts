import { useCallback, useState, useEffect } from 'react';
import { WordPressAPIV2Fallback, createWordPressAPIV2Fallback, validateWordPressUrl, testWordPressRESTAPI } from '@/lib/wordpress-api-v2-fallback';
import { WordPressSite, WordPressPost, WordPressMedia, WordPressCategory, WordPressTag, EditorContent } from '@/types';
import { useWordPressStore } from '@/lib/store';
import { 
  parseHtmlToElements, 
  convertElementsToWordPressHTML,
  extractBase64Images,
  replaceBase64WithWordPressUrls,
  base64ToFile,
  addWordPressClasses,
  wrapImageWithFigure,
  ParsedElement
} from '@/lib/parsing/html-parser';

export const useWordPress = () => {
  const {
    site,
    isConnected,
    loading,
    error,
    articles,
    currentArticle,
    media,
    categories,
    tags,
    api,
    setSite,
    setConnected,
    setLoading,
    setError,
    setArticles,
    setCurrentArticle,
    setMedia,
    setCategories,
    setTags,
    setApi,
    reset,
  } = useWordPressStore();

  // Load saved sites on initialization
  useEffect(() => {
    const loadSavedSites = async () => {
      try {
        const response = await fetch('/api/sites');
        if (response.ok) {
          const data = await response.json();
          if (data.sites && data.sites.length > 0) {
            // Use the first saved site
            const savedSite = data.sites[0];
            const newApi = createWordPressAPIV2Fallback(
              savedSite.site_url, 
              savedSite.username, 
              savedSite.app_password
            );
            setSite(savedSite);
            setApi(newApi);
            setConnected(true);
            
          }
        }
      } catch (error) {
        
      }
    };

    loadSavedSites();
  }, [setSite, setApi, setConnected]);

  // Connect to WordPress site
  const connect = useCallback(async (siteUrl: string, username: string, appPassword: string) => {
    setLoading(true);
    setError(null);

    try {
      
      
      // Validate URL format
      if (!validateWordPressUrl(siteUrl)) {
        throw new Error('Please enter a valid URL (e.g., https://yoursite.com)');
      }

      // Test REST API availability
      
      const isRESTAPIAvailable = await testWordPressRESTAPI(siteUrl);
      if (!isRESTAPIAvailable) {
        throw new Error('WordPress REST API is not available on this site. Please ensure your WordPress site is up to date and REST API is enabled.');
      }
      

      // Create API instance
      
      const newApi = createWordPressAPIV2Fallback(siteUrl, username, appPassword);

      // Test connection
      
      const isConnected = await newApi.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect. Please check your credentials and try again.');
      }
      

      // Get user information
      const user = await newApi.getCurrentUser();

      // Extract site name from URL
      const siteName = new URL(siteUrl).hostname;

      const newSite: WordPressSite = {
        id: Date.now(), // Temporary ID for new connection
        user_id: user.id,
        site_url: siteUrl,
        username: username,
        app_password: appPassword,
        site_name: siteName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save site to backend
      const savedSite = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSite),
      }).then(res => res.json());

      if (savedSite.error) {
        throw new Error(savedSite.error);
      }

      setSite(savedSite);
      setApi(newApi);
      setConnected(true);

      // Load articles, categories, and tags after successful connection
      try {
        const [articlesResult, categoriesData, tagsData] = await Promise.all([
          newApi.getPosts({ per_page: 10, page: 1 }),
          newApi.getCategories(),
          newApi.getTags(),
        ]);
        setArticles(articlesResult.posts);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (err) {
        console.error('Failed to load data after connection:', err);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSite, setConnected]);

  // Disconnect from WordPress site
  const disconnect = useCallback(() => {
    setApi(null);
    reset();
  }, [reset]);

  // Get posts
  const getPosts = useCallback(async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    categories?: number[];
    tags?: number[];
    orderby?: string;
    order?: 'asc' | 'desc';
  } = {}) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.getPosts(params);
      setArticles(result.posts);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, setLoading, setError, setArticles]);

  // Get posts without setting global state (for pagination)
  const fetchPosts = useCallback(async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    categories?: number[];
    tags?: number[];
    orderby?: string;
    order?: 'asc' | 'desc';
  } = {}) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.getPosts(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, setLoading, setError]);

  // Get single post
  const getPost = useCallback(async (id: number, context: 'view' | 'edit' = 'edit') => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const post = await api.getPost(id, context);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Create post
  const createPost = useCallback(async (postData: EditorContent) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const post = await api.createPost(postData);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Update post
  const updatePost = useCallback(async (id: number, postData: Partial<EditorContent>) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const post = await api.updatePost(id, postData);
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Delete post
  const deletePost = useCallback(async (id: number) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const success = await api.deletePost(id);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get media
  const getMedia = useCallback(async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    media_type?: string;
    mime_type?: string;
  } = {}) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.getMedia(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Upload media
  const uploadMedia = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const media = await api.uploadMedia(file, onProgress);
      return media;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Update media
  const updateMedia = useCallback(async (id: number, data: {
    caption?: string;
    alt_text?: string;
  }) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const media = await api.updateMedia(id, data);
      return media;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update media';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get categories
  const getCategories = useCallback(async () => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const categories = await api.getCategories();
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get tags
  const getTags = useCallback(async () => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      const tags = await api.getTags();
      return tags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tags';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Process shortcodes
  const processShortcodes = useCallback(async (content: string) => {
    if (!api) {
      return content;
    }

    try {
      const processedContent = await api.processShortcodes(content);
      return processedContent;
    } catch (err) {
      console.warn('Failed to process shortcodes:', err);
      return content;
    }
  }, [api]);

  // Enhanced WordPress compatibility functions

  // Parse HTML content into structured elements for editing
  const parseContentForEditing = useCallback((htmlContent: string): ParsedElement[] => {
    return parseHtmlToElements(htmlContent);
  }, []);

  // Convert structured elements back to WordPress-compatible HTML
  const convertToWordPressHTML = useCallback((elements: ParsedElement[]): string => {
    // Add WordPress classes to elements
    const wordPressElements = elements.map(element => addWordPressClasses(element));
    return convertElementsToWordPressHTML(wordPressElements);
  }, []);

  // Process base64 images and upload to WordPress
  const processBase64Images = useCallback(async (elements: ParsedElement[]): Promise<ParsedElement[]> => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    const base64Images = extractBase64Images(elements);
    
    if (base64Images.length === 0) {
      return elements;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload each base64 image to WordPress
      const uploadPromises = base64Images.map(async (imageData) => {
        try {
          // Convert base64 to File object
          const file = base64ToFile(imageData.base64Data, `image-${Date.now()}.jpg`);
          
          // Upload to WordPress media library
          const uploadResult = await api.uploadMedia(file);

          return {
            originalBase64: imageData.base64Data,
            wordPressUrl: uploadResult.source_url,
            altText: imageData.altText,
            success: true,
          };
        } catch (error) {
          console.error('Failed to upload image:', error);
          return {
            originalBase64: imageData.base64Data,
            wordPressUrl: '',
            altText: imageData.altText,
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
          };
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for upload failures
      const failedUploads = uploadResults.filter(result => !result.success);
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).join(', ');
        throw new Error(`Failed to upload ${failedUploads.length} image(s): ${errorMessages}`);
      }

      // Replace base64 URLs with WordPress URLs
      const successfulUploads = uploadResults.filter(result => result.success);
      const processedElements = replaceBase64WithWordPressUrls(elements, successfulUploads);
      
      return processedElements;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process images';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Update post with WordPress-compatible content
  const updatePostWithWordPressCompatibility = useCallback(async (
    postId: number, 
    content: string, 
    title?: string, 
    status: 'publish' | 'draft' | 'pending' | 'private' = 'publish'
  ) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      // Parse content into structured elements
      const elements = parseHtmlToElements(content);
      
      // Process any base64 images first
      const processedElements = await processBase64Images(elements);
      
      // Convert to WordPress-compatible HTML
      const wordPressHTML = convertToWordPressHTML(processedElements);
      
      // Update the post
      const result = await api.updatePost(postId, {
        content: wordPressHTML,
        title: title,
        status: status
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, processBase64Images, convertToWordPressHTML]);

  // Create post with WordPress-compatible content
  const createPostWithWordPressCompatibility = useCallback(async (
    content: string, 
    title: string, 
    status: 'publish' | 'draft' | 'pending' | 'private' = 'draft'
  ) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      // Parse content into structured elements
      const elements = parseHtmlToElements(content);
      
      // Process any base64 images first
      const processedElements = await processBase64Images(elements);
      
      // Convert to WordPress-compatible HTML
      const wordPressHTML = convertToWordPressHTML(processedElements);
      
      // Create the post
      const result = await api.createPost({
        title: title,
        content: wordPressHTML,
        excerpt: '',
        status: status,
        featured_media: null,
        categories: [],
        tags: []
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, processBase64Images, convertToWordPressHTML]);

  // Upload image with WordPress compatibility
  const uploadImageWithWordPressCompatibility = useCallback(async (
    file: File, 
    altText?: string,
    caption?: string,
    description?: string
  ) => {
    if (!api) {
      throw new Error('Not connected to WordPress site');
    }

    setLoading(true);
    setError(null);

    try {
      // Upload to WordPress media library
      const uploadResult = await api.uploadMedia(file);

      // Return WordPress-compatible image element
      const imageElement: ParsedElement = {
        type: 'element',
        tag: 'img',
        attributes: {
          src: uploadResult.source_url,
          alt: altText || '',
          width: uploadResult.media_details?.width?.toString() || 'auto',
          height: uploadResult.media_details?.height?.toString() || 'auto',
          class: `wp-image-${uploadResult.id}`
        },
        isVoid: true
      };

      // Wrap with figure for WordPress compatibility
      const wrappedImage = wrapImageWithFigure(imageElement);
      
      return {
        element: wrappedImage,
        media: uploadResult
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    // State
    api,
    site,
    loading,
    error,
    articles,
    currentArticle,
    media,
    categories,
    tags,

    // Actions
    connect,
    disconnect,
    getPosts,
    fetchPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getMedia,
    uploadMedia,
    updateMedia,
    getCategories,
    getTags,
    processShortcodes,

    // Enhanced WordPress compatibility functions
    parseContentForEditing,
    convertToWordPressHTML,
    processBase64Images,
    updatePostWithWordPressCompatibility,
    createPostWithWordPressCompatibility,
    uploadImageWithWordPressCompatibility,

    // Utilities
    isConnected,
  };
};
