import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { WordPressPost, WordPressMedia, WordPressCategory, WordPressTag, WordPressUser, EditorContent } from '@/types';

export class WordPressAPIV2Fallback {
  private client: AxiosInstance;
  private siteUrl: string;
  private credentials: string;

  constructor(siteUrl: string, username: string, appPassword: string) {
    this.siteUrl = siteUrl.replace(/\/$/, ''); // Remove trailing slash
    this.credentials = btoa(`${username}:${appPassword}`);
    
    this.client = axios.create({
      baseURL: `${this.siteUrl}/wp-json/wp/v2`,
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // Increased to 2 minutes for large image uploads
    });

    // Add request interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your credentials.');
        } else if (error.response?.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (error.response?.status === 404) {
          throw new Error('WordPress site not found or REST API not available.');
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to WordPress site. Please check the URL.');
        }
        throw error;
      }
    );
  }

  // Test connection to WordPress site
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/users/me');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get current user information
  async getCurrentUser(): Promise<WordPressUser> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  // Posts API with proper WordPress standards
  async getPosts(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    categories?: number[];
    tags?: number[];
    orderby?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<{ posts: WordPressPost[]; total: number; totalPages: number }> {
    const queryParams = {
      per_page: 10,
      page: 1,
      _embed: true,
      ...params,
    };

    // If status is undefined or 'all', explicitly request both published and draft
    if (!params.status || params.status === 'all') {
      queryParams.status = 'publish,draft';
    }

    const response = await this.client.get('/posts', {
      params: queryParams,
    });

    return {
      posts: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  }

  async getPost(id: number, context: 'view' | 'edit' = 'edit'): Promise<WordPressPost> {
    const response = await this.client.get(`/posts/${id}`, {
      params: { context, _embed: true },
    });
    return response.data;
  }

  // Create post with proper WordPress field structure
  async createPost(postData: EditorContent): Promise<WordPressPost> {
    const response = await this.client.post('/posts', {
      title: postData.title, // WordPress REST API expects title as a string
      content: postData.content, // WordPress REST API expects content as a string
      excerpt: postData.excerpt, // WordPress REST API expects excerpt as a string
      status: postData.status,
      featured_media: postData.featured_media,
      categories: postData.categories,
      tags: postData.tags,
    });
    return response.data;
  }

  // Update post using POST method (WordPress standard)
  async updatePost(id: number, postData: Partial<EditorContent>): Promise<WordPressPost> {
    const updateData: any = {};
    
    // Only include fields that are being updated
    if (postData.title !== undefined) {
      updateData.title = postData.title; // WordPress REST API expects title as a string
    }
    if (postData.content !== undefined) {
      updateData.content = postData.content; // WordPress REST API expects content as a string
    }
    if (postData.excerpt !== undefined) {
      updateData.excerpt = postData.excerpt; // WordPress REST API expects excerpt as a string
    }
    if (postData.status !== undefined) {
      updateData.status = postData.status;
    }
    if (postData.featured_media !== undefined) {
      updateData.featured_media = postData.featured_media;
    }
    if (postData.categories !== undefined) {
      updateData.categories = postData.categories;
    }
    if (postData.tags !== undefined) {
      updateData.tags = postData.tags;
    }

    const response = await this.client.put(`/posts/${id}`, updateData);
    return response.data;
  }

  async deletePost(id: number): Promise<boolean> {
    const response = await this.client.delete(`/posts/${id}`, {
      params: { force: true },
    });
    return response.status === 200;
  }

  // Media API
  async getMedia(params: {
    page?: number;
    per_page?: number;
    search?: string;
    media_type?: string;
    mime_type?: string;
  } = {}): Promise<{ media: WordPressMedia[]; total: number; totalPages: number }> {
    const response = await this.client.get('/media', {
      params: {
        per_page: 20,
        page: 1,
        ...params,
      },
    });

    return {
      media: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  }

  async uploadMedia(file: File, onProgress?: (progress: number) => void): Promise<WordPressMedia> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const response = await this.client.delete(`/media/${id}`, {
      params: { force: true },
    });
    return response.status === 200;
  }

  // Categories API
  async getCategories(): Promise<WordPressCategory[]> {
    const response = await this.client.get('/categories', {
      params: { per_page: 100 },
    });
    return response.data;
  }

  async createCategory(name: string, description?: string): Promise<WordPressCategory> {
    const response = await this.client.post('/categories', {
      name,
      description: description || '',
    });
    return response.data;
  }

  // Tags API
  async getTags(): Promise<WordPressTag[]> {
    const response = await this.client.get('/tags', {
      params: { per_page: 100 },
    });
    return response.data;
  }

  async createTag(name: string, description?: string): Promise<WordPressTag> {
    const response = await this.client.post('/tags', {
      name,
      description: description || '',
    });
    return response.data;
  }

  // Get rendered content for preview
  async getRenderedContent(postId: number): Promise<string> {
    const post = await this.getPost(postId, 'view');
    return post.content.rendered;
  }

  // Utility methods
  getSiteUrl(): string {
    return this.siteUrl;
  }

  getCredentials(): string {
    return this.credentials;
  }

  // Set nonce for CSRF protection (not used in this fallback)
  setNonce(nonce: string): void {
    // Not implemented in fallback version
  }

  // Process shortcodes (requires custom endpoint)
  async processShortcodes(content: string): Promise<string> {
    try {
      const response = await this.client.post('/posts/process-shortcodes', {
        content,
      });
      return response.data.processed_content || content;
    } catch (error) {
      // If custom endpoint doesn't exist, return original content
      console.warn('Shortcode processing endpoint not available');
      return content;
    }
  }
}

// Factory function to create API instance
export const createWordPressAPIV2Fallback = (siteUrl: string, username: string, appPassword: string): WordPressAPIV2Fallback => {
  return new WordPressAPIV2Fallback(siteUrl, username, appPassword);
};

// Utility function to validate WordPress URL
export const validateWordPressUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Utility function to test WordPress REST API availability
export const testWordPressRESTAPI = async (siteUrl: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${siteUrl}/wp-json/wp/v2/`, {
      timeout: 10000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};
