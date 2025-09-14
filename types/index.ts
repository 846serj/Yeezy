// Global window extensions
declare global {
  interface Window {
    wordPressUpload?: (file: File) => Promise<{
      source_url: string;
      alt_text?: string;
      [key: string]: any;
    }>;
  }
}


// WordPress API Types
export interface WordPressPost {
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: 'publish' | 'draft' | 'private' | 'pending';
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  sticky: boolean;
  template: string;
  format: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
  meta: Record<string, any>;
  categories: number[];
  tags: number[];
  _links: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
    about: Array<{ href: string }>;
    author: Array<{ embeddable: boolean; href: string }>;
    replies: Array<{ embeddable: boolean; href: string }>;
    'version-history': Array<{ count: number; href: string }>;
    'predecessor-version': Array<{ id: number; href: string }>;
    'wp:attachment': Array<{ href: string }>;
    'wp:term': Array<{ taxonomy: string; embeddable: boolean; href: string }>;
    curies: Array<{ name: string; href: string; templated: boolean }>;
  };
}

export interface WordPressMedia {
  id: number;
  date: string;
  slug: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  template: string;
  meta: Record<string, any>;
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: 'image' | 'video' | 'audio' | 'application';
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: {
      [key: string]: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
    };
    image_meta: Record<string, any>;
  };
  source_url: string;
  _links: Record<string, any>;
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
  meta: Record<string, any>;
  _links: Record<string, any>;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  meta: Record<string, any>;
  _links: Record<string, any>;
}

export interface WordPressUser {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    [key: string]: string;
  };
  meta: Record<string, any>;
  capabilities: Record<string, boolean>;
  extra_capabilities: Record<string, boolean>;
  _links: Record<string, any>;
}

// App State Types
export interface WordPressSite {
  url: string;
  username: string;
  appPassword: string;
  isConnected: boolean;
  user?: WordPressUser;
}

export interface ArticleEditorState {
  currentSite: WordPressSite | null;
  articles: WordPressPost[];
  currentArticle: WordPressPost | null;
  media: WordPressMedia[];
  categories: WordPressCategory[];
  tags: WordPressTag[];
  loading: boolean;
  error: string | null;
}

// Editor Types
export interface EditorContent {
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'private' | 'pending';
  featured_media: number | null;
  categories: number[];
  tags: number[];
}

// WordPress API Field Types (for proper REST API integration)
export interface WordPressTitleField {
  rendered: string;
  raw?: string;
}

export interface WordPressContentField {
  rendered: string;
  raw: string;
  protected: boolean;
}

export interface WordPressExcerptField {
  rendered: string;
  raw: string;
  protected: boolean;
}

// Enhanced WordPress Post with proper field structure
export interface WordPressPostEnhanced extends Omit<WordPressPost, 'title' | 'content' | 'excerpt'> {
  title: WordPressTitleField;
  content: WordPressContentField;
  excerpt: WordPressExcerptField;
}

// API Response Types
export interface WordPressAPIResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface WordPressListResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}
