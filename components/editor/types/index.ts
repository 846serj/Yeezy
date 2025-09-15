export interface ImageResult {
  id: string;
  url: string;
  full: string;
  caption: string;
  alt: string;
  attribution?: string;
  source: 'unsplash' | 'pexels' | 'pixabay' | 'local';
  photographer?: string;
  photographerUrl?: string;
}

export interface EditorContent {
  id?: number;
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'private' | 'pending';
  featured_media: number | null;
  categories: number[];
  tags: number[];
  _embedded?: any; // Include embedded data for featured image
}

export interface GutenbergBlock {
  clientId: string;
  name: string;
  isValid: boolean;
  attributes: Record<string, any>;
  innerBlocks: GutenbergBlock[];
}

export interface ClientOnlyGutenbergEditorProps {
  post: EditorContent | null;
  onSave: (post: EditorContent) => void;
  onCancel: () => void;
}

export interface BlockEditorSettings {
  hasFixedToolbar: boolean;
  focusMode: boolean;
  hasReducedUI: boolean;
  // Enable insertion points between blocks
  __experimentalBlockInserter?: boolean;
  __experimentalBlockToolbar?: boolean;
  __experimentalBlockList?: boolean;
  // Additional settings for block insertion
  allowedBlockTypes?: boolean;
  templateLock?: boolean | string;
  __experimentalBlockPatterns?: any[];
  __experimentalBlockPatternCategories?: any[];
  // Enable insertion points
  __experimentalBlockEditor?: {
    showInsertionPoint?: boolean;
    showBlockAppender?: boolean;
  };
  __experimentalFeatures: {
    typography: {
      fontSize: boolean;
      fontFamily: boolean;
      fontStyle: boolean;
      fontWeight: boolean;
      letterSpacing: boolean;
      lineHeight: boolean;
      textDecoration: boolean;
      textTransform: boolean;
    };
    color: {
      background: boolean;
      custom: boolean;
      customDuotone: boolean;
      customGradient: boolean;
      defaultDuotone: boolean;
      defaultGradient: boolean;
      defaultPalette: boolean;
      duotone: boolean;
      gradients: boolean;
      link: boolean;
      palette: boolean;
      text: boolean;
    };
    spacing: {
      blockGap: boolean;
      margin: boolean;
      padding: boolean;
      units: string[];
    };
  };
}
