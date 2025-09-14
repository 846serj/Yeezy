// Editor Configuration
export const EDITOR_CONFIG = {
  // Use WordPress official components (more stable, less customizable)
  USE_WORDPRESS_OFFICIAL: true,
  
  // Use custom implementation (more customizable, more maintenance)
  USE_CUSTOM_IMPLEMENTATION: false,
  
  // Fallback to custom if WordPress components fail to load
  FALLBACK_TO_CUSTOM: true,
  
  // Enable debug logging
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Block editor settings
  BLOCK_EDITOR: {
    hasFixedToolbar: true,
    focusMode: false,
    hasReducedUI: false,
    __experimentalFeatures: {
      typography: {
        fontSize: true,
        fontFamily: true,
        fontStyle: true,
        fontWeight: true,
        letterSpacing: true,
        lineHeight: true,
        textDecoration: true,
        textTransform: true,
      },
      color: {
        background: true,
        custom: true,
        customDuotone: true,
        customGradient: true,
        defaultDuotone: true,
        defaultGradient: true,
        defaultPalette: true,
        duotone: true,
        gradients: true,
        link: true,
        palette: true,
        text: true,
      },
      spacing: {
        blockGap: true,
        margin: true,
        padding: true,
        units: ['px', 'em', 'rem', 'vh', 'vw', '%'],
      },
    },
  },
  
  // Image search settings
  IMAGE_SEARCH: {
    enabled: true,
    sources: ['unsplash', 'pexels', 'pixabay'],
    defaultSource: 'all',
    perPage: 20,
  },
  
  // Auto-resize settings
  AUTO_RESIZE: {
    enabled: true,
    minHeight: 32,
    maxHeight: 400,
    buffer: 4,
  },
} as const;

export type EditorConfig = typeof EDITOR_CONFIG;
