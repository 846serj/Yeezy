/* ========================================
   CLEAN TYPESCRIPT TYPES
   Industry-standard type definitions
   ======================================== */

// ========================================
// CORE TYPES
// ========================================

export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name?: string;
  avatar?: string;
}

export interface Site extends BaseEntity {
  url: string;
  name: string;
  username: string;
  appPassword: string;
  userId: string;
}

// ========================================
// WORDPRESS TYPES
// ========================================

export interface WordPressPost {
  id: number;
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
  status: 'publish' | 'draft' | 'private' | 'pending';
  type: 'post' | 'page';
  slug: string;
  link: string;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  author: number;
  featured_media: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  sticky: boolean;
  template: string;
  format: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
  meta: Record<string, unknown>;
  categories: number[];
  tags: number[];
  _links: Record<string, unknown>;
}

export interface WordPressMedia {
  id: number;
  date: string;
  slug: string;
  type: 'attachment';
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  comment_status: 'open' | 'closed';
  ping_status: 'open' | 'closed';
  template: string;
  meta: Record<string, unknown>;
  description: {
    rendered: string;
  };
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: 'image' | 'file';
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: Record<string, {
      file: string;
      width: number;
      height: number;
      mime_type: string;
      source_url: string;
    }>;
    image_meta: Record<string, unknown>;
  };
  source_url: string;
  _links: Record<string, unknown>;
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: 'category';
  parent: number;
  meta: Record<string, unknown>;
  _links: Record<string, unknown>;
}

export interface WordPressTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: 'post_tag';
  meta: Record<string, unknown>;
  _links: Record<string, unknown>;
}

// ========================================
// EDITOR TYPES
// ========================================

export interface BlockAttributes {
  [key: string]: unknown;
}

export interface Block {
  clientId: string;
  name: string;
  isValid: boolean;
  attributes: BlockAttributes;
  innerBlocks: Block[];
  innerContent: (string | null)[];
  innerHTML: string;
}

export interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  isEditing: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export interface EditorProps {
  post: WordPressPost;
  onSave: (post: Partial<WordPressPost>) => Promise<void>;
  onCancel: () => void;
  onImageClick?: (imageUrl: string, clickX: number, clickY: number) => void;
}

// ========================================
// COMPONENT TYPES
// ========================================

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'url';
  className?: string;
  label?: string;
  error?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
  onError: (error: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

// ========================================
// API TYPES
// ========================================

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ========================================
// FORM TYPES
// ========================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SiteFormData {
  url: string;
  name: string;
  username: string;
  appPassword: string;
}

export interface PostFormData {
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish';
  categories: number[];
  tags: number[];
  featuredMedia?: number;
}

// ========================================
// HOOK TYPES
// ========================================

export interface UseWordPressReturn {
  isLoading: boolean;
  error: string | null;
  posts: WordPressPost[];
  categories: WordPressCategory[];
  tags: WordPressTag[];
  createPost: (post: Partial<WordPressPost>) => Promise<WordPressPost>;
  updatePost: (id: number, post: Partial<WordPressPost>) => Promise<WordPressPost>;
  deletePost: (id: number) => Promise<void>;
  uploadMedia: (file: File) => Promise<WordPressMedia>;
  searchImages: (query: string) => Promise<WordPressMedia[]>;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}

// ========================================
// UTILITY TYPES
// ========================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ========================================
// EVENT TYPES
// ========================================

export interface KeyboardEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface MouseEvent {
  clientX: number;
  clientY: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
}

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    imageSearch: boolean;
    aiGeneration: boolean;
    autoSave: boolean;
    realTimePreview: boolean;
  };
  limits: {
    maxFileSize: number;
    maxPostsPerPage: number;
    maxImageSearchResults: number;
  };
}

// ========================================
// ERROR TYPES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface NetworkError {
  status: number;
  statusText: string;
  url: string;
  method: string;
}

export interface BusinessError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
