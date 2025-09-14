import { useState, useCallback, useEffect } from 'react';
import { GutenbergAPI, GutenbergPost, GutenbergBlock } from '@/lib/gutenberg-api';
import { WordPressPost } from '@/types';
import { useGutenbergStore } from '@/hooks/useGutenbergStore';

export const useGutenberg = () => {
  const [api, setApi] = useState<GutenbergAPI | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use our simple store instead of WordPress data store
  const {
    title,
    content,
    status,
    featuredImage,
    categories,
    tags,
    setTitle: setEditorTitle,
    setContent: setEditorContent,
    setStatus: setEditorStatus,
    setFeaturedImage: setEditorFeaturedImage,
    setCategories: setEditorCategories,
    setTags: setEditorTags,
  } = useGutenbergStore();

  // Connect to WordPress
  const connect = useCallback(async (siteUrl: string, username: string, appPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const gutenbergApi = new GutenbergAPI(siteUrl, username, appPassword);
      
      // Test connection by fetching posts
      await gutenbergApi.getPosts(1, 1);
      
      setApi(gutenbergApi);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to WordPress');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect from WordPress
  const disconnect = useCallback(() => {
    setApi(null);
    setIsConnected(false);
    setError(null);
  }, []);

  // Load post for editing
  const loadPost = useCallback(async (postId: number) => {
    if (!api) return null;

    try {
      setLoading(true);
      setError(null);
      
      const post = await api.getPost(postId);
      
      // Update editor state
      setEditorTitle(post.title?.rendered || '');
      setEditorContent(post.content?.rendered || '');
      setEditorStatus(post.status || 'draft');
      
      // Parse content to blocks
      const blocks = api.parseHtmlToBlocks(post.content?.rendered || '');
      
      return { post, blocks };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, setEditorTitle, setEditorContent, setEditorStatus]);

  // Save post
  const savePost = useCallback(async (postId?: number, blocks?: GutenbergBlock[]) => {
    if (!api) return null;

    try {
      setLoading(true);
      setError(null);
      
      const postData: GutenbergPost = {
        title,
        content,
        status: status as any,
        featured_media: featuredImage?.id,
        categories: categories.map((cat: any) => cat.id),
        tags: tags.map((tag: any) => tag.id),
        blocks,
      };

      let result: WordPressPost;
      
      if (postId) {
        result = await api.updatePost(postId, postData);
      } else {
        result = await api.createPost(postData);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, title, content, status, featuredImage, categories, tags]);

  // Upload media
  const uploadMedia = useCallback(async (file: File, altText?: string, caption?: string) => {
    if (!api) return null;

    try {
      setLoading(true);
      setError(null);
      
      const media = await api.uploadMedia(file, altText, caption);
      return media;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get categories
  const getCategories = useCallback(async () => {
    if (!api) return [];

    try {
      setLoading(true);
      setError(null);
      
      const categories = await api.getCategories();
      return categories;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Get tags
  const getTags = useCallback(async () => {
    if (!api) return [];

    try {
      setLoading(true);
      setError(null);
      
      const tags = await api.getTags();
      return tags;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Parse HTML to blocks (works without API)
  const parseHtmlToBlocks = useCallback((htmlContent: string): GutenbergBlock[] => {
    if (!htmlContent) return [];
    
    // Create a temporary API instance for parsing
    const tempApi = new GutenbergAPI('', '', '');
    return tempApi.parseHtmlToBlocks(htmlContent);
  }, []);

  // Convert blocks to HTML (works without API)
  const blocksToHtml = useCallback((blocks: GutenbergBlock[]): string => {
    if (!blocks || blocks.length === 0) return '';
    
    // Create a temporary API instance for conversion
    const tempApi = new GutenbergAPI('', '', '');
    return tempApi.blocksToHtml(blocks);
  }, []);

  return {
    // Connection state
    isConnected,
    loading,
    error,
    
    // Editor state
    title,
    content,
    status,
    featuredImage,
    categories,
    tags,
    
    // Actions
    connect,
    disconnect,
    loadPost,
    savePost,
    uploadMedia,
    getCategories,
    getTags,
    parseHtmlToBlocks,
    blocksToHtml,
    
    // State setters
    setEditorContent,
    setEditorTitle,
    setEditorStatus,
    setEditorFeaturedImage,
    setEditorCategories,
    setEditorTags,
  };
};

export default useGutenberg;
