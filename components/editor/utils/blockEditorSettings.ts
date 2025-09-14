import { BlockEditorSettings } from '../types';

export const getBlockEditorSettings = (): BlockEditorSettings => ({
  hasFixedToolbar: true,
  focusMode: false,
  hasReducedUI: false,
  // Enable insertion points between blocks
  __experimentalBlockInserter: true,
  __experimentalBlockToolbar: true,
  __experimentalBlockList: true,
  // Enable block insertion features
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
  // Additional settings for block insertion
  allowedBlockTypes: true,
  templateLock: false,
  __experimentalBlockPatterns: [],
  __experimentalBlockPatternCategories: [],
  // Additional insertion settings
  __experimentalBlockEditor: {
    showInsertionPoint: true,
    showBlockAppender: true,
  },
});
