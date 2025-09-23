'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { ClientOnlyGutenbergEditorProps, GutenbergBlock, ImageResult } from '../types';
import { useWordPressComponents } from '../hooks/useWordPressComponents';
import { useBlockManagement } from '../hooks/useBlockManagement';
import { useImageSearch } from '../hooks/useImageSearch';
import { convertHtmlToBlocks } from '../utils/htmlParser';
import { getBlockEditorSettings } from '../utils/blockEditorSettings';
import { useContentEditable } from '../../../hooks/useContentEditable';
import { RichTextParagraph } from './RichTextParagraph';

// TitleInput component
interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

const TitleInput: React.FC<TitleInputProps> = ({ value, onChange }) => {
  const { ref, onInput, onCompositionStart, onCompositionEnd, onKeyDown } = useContentEditable({
    value,
    onChange,
  });

  return (
    <div
      ref={ref}
      role="document"
      aria-multiline="true"
      className="wp-block wp-block-post-title block-editor-block-list__block editor-post-title editor-post-title__input rich-text article-title"
      aria-label="Add title"
      contentEditable={true}
      data-wp-block-attribute-key="title"
      style={{
        textAlign: 'left',
        width: '100%',
        whiteSpace: 'pre-wrap',
        minWidth: '1px',
        overflowWrap: 'break-word',
        lineBreak: 'after-white-space' as any,
        direction: 'ltr',
        unicodeBidi: 'normal',
        ...({
          WebkitNbspMode: 'space',
          WebkitUserModify: 'read-write'
        } as any)
      }}
      onInput={onInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
      suppressContentEditableWarning={true}
    />
  );
};

// ContentEditableHeading component
interface ContentEditableHeadingProps {
  block: GutenbergBlock;
  onContentChange: (content: string) => void;
  onDelete: () => void;
}

const ContentEditableHeading: React.FC<ContentEditableHeadingProps> = ({ block, onContentChange, onDelete }) => {
  const { ref, onInput, onCompositionStart, onCompositionEnd, onKeyDown } = useContentEditable({
    value: block.attributes.content || '',
    onChange: onContentChange,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      try {
        if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
          onDelete();
        }
      } catch (error) {
        console.warn('ContentEditable keydown error:', error);
      }
    }
  });

  return (
    <div
      ref={ref}
      role="document"
      aria-multiline="true"
      className={`block-editor-rich-text__editable block-editor-block-list__block wp-block is-selected wp-block-heading rich-text heading-input heading-input--h${block.attributes.level || 2}`}
      id={`block-${block.clientId}`}
      aria-label="Block: Heading"
      data-block={block.clientId}
      data-type="core/heading"
      data-title="Heading"
      contentEditable={true}
      data-wp-block-attribute-key="content"
      style={{
        whiteSpace: 'pre-wrap',
        minWidth: '1px',
        overflowWrap: 'break-word',
        lineBreak: 'after-white-space' as any,
        margin: '1em 0',
        fontSize: '13px',
        lineHeight: '1.5',
        ...({
          WebkitNbspMode: 'space',
          WebkitUserModify: 'read-write'
        } as any)
      }}
      onInput={onInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
      suppressContentEditableWarning={true}
    />
  );
};

// Import existing components
import ImageSearchModal from '../../ImageSearchModal';
import CropModal from '../../CropModal';
import SimpleImageToolbar from '../../SimpleImageToolbar';

export interface WordPressBlockEditorRef {
  handleSaveWithUploadCheck: () => Promise<void>;
  getUploadState: () => { hasUploadingImages: boolean; isSaving: boolean } | null;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout;
  const debounced = ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debounced;
}

const WordPressBlockEditor = forwardRef<WordPressBlockEditorRef, ClientOnlyGutenbergEditorProps>(({ 
  post, 
  onSave, 
  onCancel 
}, ref) => {
  
  const [isClient, setIsClient] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<any>(null);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [showBlockInserter, setShowBlockInserter] = useState(false);
  const [inserterPosition, setInserterPosition] = useState<{ index: number; x: number; y: number; popupX: number; popupY: number } | null>(null);
  const [inserterSearchQuery, setInserterSearchQuery] = useState('');
  const [showImageResults, setShowImageResults] = useState(false);
  const [pendingImageInsertion, setPendingImageInsertion] = useState<{ index: number } | null>(null);
  const [cropLoading, setCropLoading] = useState(false);
  const [inserterImages, setInserterImages] = useState<any[]>([]);
  const [inserterPage, setInserterPage] = useState(1);
  const [inserterHasMore, setInserterHasMore] = useState(false);
  const [inserterLoading, setInserterLoading] = useState(false);
  
  // Upload state management - Industry standard pattern for preventing saves during uploads
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Helper functions for upload state management
  // Usage: addUploadingImage(uploadId) at start of upload, removeUploadingImage(uploadId) when done
  const addUploadingImage = useCallback((imageId: string) => {
    setUploadingImages(prev => new Set(Array.from(prev).concat(imageId)));
  }, []);
  
  const removeUploadingImage = useCallback((imageId: string) => {
    setUploadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, []);
  
  // Check if any images are still uploading
  const hasUploadingImages = uploadingImages.size > 0;
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedFeaturedImage, setSelectedFeaturedImage] = useState<boolean>(false);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedImageElement, setSelectedImageElement] = useState<HTMLImageElement | null>(null);
  const [imageToReplace, setImageToReplace] = useState<{ element: HTMLImageElement; blockId: string | null } | null>(null);
  // Featured image search state - separate from body image search
  const [showFeaturedImageSearch, setShowFeaturedImageSearch] = useState(false);
  const [featuredImageSearchImages, setFeaturedImageSearchImages] = useState<ImageResult[]>([]);
  const [featuredImageSearchLoading, setFeaturedImageSearchLoading] = useState(false);
  const [featuredImageSelectedSources, setFeaturedImageSelectedSources] = useState<string[]>(['unsplash', 'pexels', 'wikiCommons']);
  const [featuredImageHasMore, setFeaturedImageHasMore] = useState(false);
  const [featuredImageLastQuery, setFeaturedImageLastQuery] = useState<string>('');

  // Block types for inserter
  const blockTypes = [
    { 
      name: 'core/paragraph', 
      title: 'Paragraph', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="m9.99609 14v-.2251l.00391.0001v6.225h1.5v-14.5h2.5v14.5h1.5v-14.5h3v-1.5h-8.50391c-2.76142 0-5 2.23858-5 5 0 2.7614 2.23858 5 5 5z"></path>
        </svg>
      ), 
      description: 'Start with the building block of all narrative.' 
    },
    { 
      name: 'core/heading', 
      title: 'Heading', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M6 5V18.5911L12 13.8473L18 18.5911V5H6Z"></path>
        </svg>
      ), 
      description: 'Introduce new sections and organize content.' 
    },
    { 
      name: 'core/image', 
      title: 'Image', 
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z"></path>
        </svg>
      ), 
      description: 'Insert an image to make a visual statement.' 
    },
    { 
      name: 'core/list', 
      title: 'List', 
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M4 4v1.5h16V4H4zm8 8.5h8V11h-8v1.5zM4 20h16v-1.5H4V20zm4-8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"></path>
        </svg>
      ), 
      description: 'Create a bulleted or numbered list.' 
    },
    { 
      name: 'core/quote', 
      title: 'Quote', 
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M13 6v6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H13zm-9 6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H4v6z"></path>
        </svg>
      ), 
      description: 'Give quoted text visual emphasis.' 
    },
    { 
      name: 'core/separator', 
      title: 'Separator', 
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M4 12h16v-1.5H4V12zm0 4h16v-1.5H4V16z"></path>
        </svg>
      ), 
      description: 'Create a break between ideas or sections.' 
    },
  ];

  // Industry standard: Use CSS transforms for perfect centering
  const calculatePopupPosition = () => {
    return { popupX: 0, popupY: 0 }; // Will be overridden by CSS transforms
  };

  // Calculate toolbar position based on click coordinates
  const calculateToolbarPosition = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const toolbarWidth = 300; // Approximate width of the toolbar
    const toolbarHeight = 50; // Approximate height of the toolbar
    
    // Get the editor container element
    const editorContainer = document.querySelector('.editor-visual-editor__content');
    const containerRect = editorContainer?.getBoundingClientRect() || { left: 0, right: window.innerWidth };
    
    // Calculate available space
    const maxX = containerRect.right - toolbarWidth - 20;
    const minX = containerRect.left + 20;
    
    // Default position in the middle of the editor
    const defaultX = (containerRect.left + containerRect.right) / 2 - toolbarWidth / 2;
    
    return {
      popupX: Math.min(Math.max(defaultX, minX), maxX),
      popupY: Math.max(50, windowHeight * 0.1) // Keep toolbar in top 10% of screen but at least 50px from top
    };
  };

  // Handle block insertion
  const handleInsertBlock = (blockType: string, index: number) => {
    
    let attributes = {};
    switch (blockType) {
      case 'core/paragraph':
        attributes = { content: 'New paragraph' };
        break;
      case 'core/heading':
        attributes = { content: 'New heading', level: 2 };
        break;
      case 'core/image':
        attributes = { url: '', alt: '', caption: '' };
        break;
      case 'core/list':
        attributes = { values: '<li>List item</li>', ordered: false };
        break;
      case 'core/quote':
        attributes = { value: '<p>Quote text</p>', citation: '' };
        break;
      case 'core/separator':
        attributes = {};
        break;
      default:
        attributes = { content: 'New block' };
    }
    
    addBlock(blockType, attributes, index);
    setShowBlockInserter(false);
    setInserterPosition(null);
  };




  // Handle image selection from inserter
  const handleInserterImageSelect = (image: any) => {
    if (!inserterPosition) return;
    
    
    // Set the image for cropping and the target block ID
    setCurrentImageToCrop(image);
    setCurrentBlockId(`block-${Date.now()}-${inserterPosition.index}`);
    setPendingImageInsertion({ index: inserterPosition.index });
    
    // Close the inserter and open crop modal
    setShowBlockInserter(false);
    setInserterPosition(null);
    setShowImageResults(false);
    setInserterSearchQuery('');
    setShowCropModal(true);
    
  };

  // Handle click outside to close inserter and image toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle block inserter
      if (showBlockInserter && 
          !(event.target as Element).closest('.block-editor-inserter__popover') && 
          !(event.target as Element).closest('.block-editor-block-list__insertion-point')) {
        setShowBlockInserter(false);
        setInserterPosition(null);
        setShowImageResults(false);
        setInserterSearchQuery('');
        setPendingImageInsertion(null);
        setInserterImages([]);
        setInserterPage(1);
        setInserterHasMore(false);
      }

      // Handle image toolbar
      if (showImageToolbar && 
          !(event.target as Element).closest('.image-toolbar-overlay') && 
          !(event.target as Element).matches('img')) {
        setShowImageToolbar(false);
        // Clear image selection
        if (selectedImageElement) {
          selectedImageElement.classList.remove('selected-image');
          // Also clear figure selection if it exists
          const figureElement = selectedImageElement.closest('figure');
          if (figureElement) {
            figureElement.classList.remove('selected-image-figure');
          }
          setSelectedImageElement(null);
        }
      }
    };

    if (showBlockInserter || showImageToolbar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBlockInserter, showImageToolbar]);

  // Handle scroll to update toolbar position with animation frame
  useEffect(() => {
    let animationFrameId: number;
    
    const updateToolbarPosition = () => {
      if (showImageToolbar && selectedImageElement) {
        const rect = selectedImageElement.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const topY = rect.top + window.scrollY;
        
        setToolbarPosition({ x: centerX, y: topY });
        
        // Continue updating on next frame
        animationFrameId = requestAnimationFrame(updateToolbarPosition);
      }
    };

    if (showImageToolbar && selectedImageElement) {
      animationFrameId = requestAnimationFrame(updateToolbarPosition);
      
      return () => {
        console.log('🧹 Stopping toolbar position updates');
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [showImageToolbar, selectedImageElement]);

  // Handle keyboard events for image deletion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle backspace when an image is selected and no input/textarea is focused
      if (event.key === 'Backspace' && 
          selectedImageElement && 
          showImageToolbar &&
          !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        
        console.log('⌨️ Backspace pressed with image selected');
        event.preventDefault();
        event.stopPropagation();
        
        // Delete the selected image
        if (selectedImageId) {
          const blockToDelete = blocks.find(block => block.clientId === selectedImageId);
          
          if (blockToDelete) {
            // Delete by block ID (preferred method)
            const updatedBlocks = blocks.filter(block => block.clientId !== selectedImageId);
            setBlocks(updatedBlocks);
            console.log('🗑️ Image block deleted by ID via backspace:', selectedImageId);
          } else {
            // Fallback: delete by image URL matching
            const imageUrl = selectedImageElement.src;
            const updatedBlocks = blocks.filter(block =>
              !(block.name === 'core/image' && (
                block.attributes.url === imageUrl ||
                block.attributes.url?.includes(imageUrl.split('/').pop() || '') ||
                imageUrl.includes(block.attributes.url?.split('/').pop() || '')
              ))
            );
            setBlocks(updatedBlocks);
            console.log('🗑️ Image block deleted by URL matching via backspace:', imageUrl);
          }
          
          // Clear selection and close toolbar
          selectedImageElement.classList.remove('selected-image');
          // Also clear figure selection if it exists
          const figureElement = selectedImageElement.closest('figure');
          if (figureElement) {
            figureElement.classList.remove('selected-image-figure');
          }
          setSelectedImageElement(null);
          setSelectedImageId(null);
          setShowImageToolbar(false);
        }
      }
    };

    if (showImageToolbar && selectedImageElement) {
      console.log('⌨️ Adding keyboard event listener for image deletion');
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        console.log('🧹 Removing keyboard event listener');
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showImageToolbar, selectedImageElement, selectedImageId]);

  // Handle image clicks for toolbar and selection
  useEffect(() => {
    console.log('🎯 Setting up image click event listener...');

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the clicked element is an image
      if (target.tagName === 'IMG') {
        console.log('🖼️ Image clicked!', target.className);

        // Only target images that are NOT in search results or popups
        const isInInserterPopup = target.closest('.block-editor-inserter__popover');
        const isInModal = target.closest('.components-modal__content');
        const isInSearchResults = target.closest('.block-editor-inserter__search') ||
                                 target.closest('.block-editor-inserter__block-list');

        if (isInInserterPopup || isInModal || isInSearchResults) {
          console.log('🚫 Ignoring popup/modal/search result image click');
          return;
        }

        // Check if it's within the WordPress editor content
        const isInEditorContent = target.closest('.editor-visual-editor__content') ||
                                 target.closest('.editor-styles-wrapper') ||
                                 target.closest('.block-editor-writing-flow');

        // Check if it's a featured image (exclude from toolbar)
        const isFeaturedImage = target.closest('.editor-visual-editor__featured-image-wrapper');

        console.log('🔍 Is in editor content:', !!isInEditorContent);
        console.log('🔍 Is featured image:', !!isFeaturedImage);
        console.log('🔍 Available CSS classes on image:', target.className);
        console.log('🔍 Parent elements:', target.parentElement?.tagName, target.parentElement?.className);

        if (isInEditorContent && !isFeaturedImage) {
          console.log('✅ Image clicked in WordPress editor!', target);
          
          // Clear ALL previous selections (ensure only one image selected at a time)
          if (selectedImageElement) {
            selectedImageElement.classList.remove('selected-image');
            // Also clear figure selection if it exists
            const figureElement = selectedImageElement.closest('figure');
            if (figureElement) {
              figureElement.classList.remove('selected-image-figure');
            }
          }
          
          // Also clear any existing selections in the DOM (safety cleanup)
          document.querySelectorAll('.selected-image').forEach(el => {
            el.classList.remove('selected-image');
          });
          document.querySelectorAll('.selected-image-figure').forEach(el => {
            el.classList.remove('selected-image-figure');
          });
          
          // Add selection class to the figure (image + caption) if it exists, otherwise just the image
          const imageElement = target as HTMLImageElement;
          const figureElement = imageElement.closest('figure');
          
          if (figureElement) {
            figureElement.classList.add('selected-image-figure');
            console.log('🎯 Selected entire figure (image + caption)');
          } else {
            imageElement.classList.add('selected-image');
            console.log('🎯 Selected image only');
          }
          
          setSelectedImageElement(imageElement);
          
          // Find the matching block for delete functionality
          const imageUrl = imageElement.src;
          console.log('🔍 Searching for block with URL:', imageUrl);

          const imageBlocks = blocks.filter(block => block.name === 'core/image');
          console.log('🔍 Available image blocks:', imageBlocks.length);

          const matchingBlock = imageBlocks.find(block =>
            block.attributes.url === imageUrl ||
            block.attributes.url?.includes(imageUrl.split('/').pop() || '') ||
            imageUrl.includes(block.attributes.url?.split('/').pop() || '')
          );

          if (matchingBlock) {
            setSelectedImageId(matchingBlock.clientId);
            console.log('🎯 Found matching block for delete functionality:', matchingBlock.clientId);
          } else {
            console.log('⚠️ Image not in blocks array - using URL as ID for toolbar');
            setSelectedImageId(imageUrl);
          }

          // Position toolbar above the image
          const rect = imageElement.getBoundingClientRect();
          const centerX = rect.left + (rect.width / 2);
          const topY = rect.top + window.scrollY;

          setToolbarPosition({ x: centerX, y: topY });
          setShowImageToolbar(true);

          console.log('✅ Image selected and toolbar positioned:', { x: centerX, y: topY });

          // Prevent event bubbling
          event.stopPropagation();
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleImageClick, true); // Use capture phase
    console.log('✅ Image click event listener added');

    return () => {
      console.log('🧹 Removing image click event listener');
      document.removeEventListener('click', handleImageClick, true);
    };
  }, [selectedImageElement, showImageToolbar]); // blocks will be available in closure


  // Handle window resize to reposition popups
  useEffect(() => {
    const handleResize = () => {
      // Handle block inserter resize
      if (showBlockInserter && inserterPosition) {
        const { popupX, popupY } = calculatePopupPosition();
        setInserterPosition(prev => prev ? { ...prev, popupX, popupY } : null);
      }
      
      // Handle image toolbar resize
      if (showImageToolbar && selectedImageElement) {
        const rect = selectedImageElement.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const topY = rect.top + window.scrollY;
        
        setToolbarPosition({ x: centerX, y: topY });
      }
    };

    if (showBlockInserter || showImageToolbar) {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showBlockInserter, inserterPosition, showImageToolbar, selectedImageElement]);

  // Custom hooks
  const { components: WordPressComponents, isLoading: componentsLoading } = useWordPressComponents();
  
  // Destructure WordPress components
  const {
    BlockEditorProvider,
    BlockList,
    SlotFillProvider,
    Button
    // Temporarily disabled to fix React error
    // BlockInserter,
    // Inserter,
    // BlockAppender
  } = WordPressComponents || {};
  const {
    blocks,
    setBlocks, 
    title, 
    setTitle, 
    featuredImage,
    setFeaturedImage,
    handleSave, 
    addBlock,
    updateBlock
  } = useBlockManagement(post, onSave);

  // Wrapper for handleSave that checks upload state
  const handleSaveWithUploadCheck = useCallback(async () => {
    if (hasUploadingImages) {
      console.log('⚠️ Cannot save while images are uploading:', Array.from(uploadingImages));
      return;
    }
    
    setIsSaving(true);
    
    // Safety timeout to prevent infinite saving state
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Save operation timed out, resetting saving state');
      setIsSaving(false);
    }, 30000); // 30 second timeout
    
    try {
      await handleSave();
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Save failed:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsSaving(false);
    }
  }, [handleSave, hasUploadingImages, uploadingImages]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    handleSaveWithUploadCheck: async () => {
      await handleSaveWithUploadCheck();
    },
    getUploadState: () => ({
      hasUploadingImages: hasUploadingImages,
      isSaving: isSaving
    })
  }), [handleSaveWithUploadCheck, hasUploadingImages, isSaving]);

  // Handle keyboard events for image deletion and Enter key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Enter key in text blocks
      if (event.key === 'Enter' && event.target instanceof HTMLElement) {
        const target = event.target as HTMLElement;
        
        // Check if we're in a text input/textarea
        if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          // Find the current block by looking for the closest block container with data-block-id
          const blockContainer = target.closest('[data-block-id]');
          
          if (blockContainer) {
            const currentBlockId = blockContainer.getAttribute('data-block-id');
            
            if (currentBlockId) {
              event.preventDefault();
              
              // Create a new paragraph block
              const newBlock: GutenbergBlock = {
                clientId: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'core/paragraph',
                isValid: true,
                attributes: {
                  content: '',
                  placeholder: 'Start writing...'
                },
                innerBlocks: []
              };
              
              // Find the current block index and insert the new block after it
              const currentIndex = blocks.findIndex(block => block.clientId === currentBlockId);
              if (currentIndex !== -1) {
                const newBlocks = [...blocks];
                newBlocks.splice(currentIndex + 1, 0, newBlock);
                setBlocks(newBlocks);
                console.log('📝 New paragraph block created after:', currentBlockId);
                
                // Focus the new textarea after a short delay
                setTimeout(() => {
                  const newTextarea = document.querySelector(`[data-block-id="${newBlock.clientId}"] textarea`) as HTMLTextAreaElement;
                  if (newTextarea) {
                    newTextarea.focus();
                  }
                }, 50);
              }
            }
          }
        }
      }
      
      // Handle Backspace in empty text blocks
      if (event.key === 'Backspace' && event.target instanceof HTMLElement) {
        const target = event.target as HTMLElement;
        
        // Check if we're in a text input/textarea or figcaption
        if (['INPUT', 'TEXTAREA', 'FIGCAPTION'].includes(target.tagName)) {
        // Don't delete blocks if we're editing a caption (input with placeholder containing "caption")
        const isCaptionInput = target.getAttribute('placeholder')?.includes('caption') || 
                              target.getAttribute('data-placeholder')?.includes('caption') ||
                              target.tagName === 'FIGCAPTION';
        
        if (isCaptionInput) {
          // Let the caption input handle backspace normally
          return;
        }
          
          // Find the current block by looking for the closest block container with data-block-id
          const blockContainer = target.closest('[data-block-id]');
          
          if (blockContainer) {
            const currentBlockId = blockContainer.getAttribute('data-block-id');
            
            if (currentBlockId) {
              // Get the current block
              const currentBlock = blocks.find(block => block.clientId === currentBlockId);
              
              if (currentBlock) {
                // Check if the block is empty (no content or only whitespace)
                const isEmpty = !currentBlock.attributes.content || 
                               currentBlock.attributes.content.trim() === '';
                
                // Only delete if block is empty and there are other blocks
                if (isEmpty && blocks.length > 1) {
                  event.preventDefault();
                  
                  // Find the current block index
                  const currentIndex = blocks.findIndex(block => block.clientId === currentBlockId);
                  
                  if (currentIndex !== -1) {
                    // Remove the empty block
                    const newBlocks = blocks.filter(block => block.clientId !== currentBlockId);
                    setBlocks(newBlocks);
                    console.log('🗑️ Empty block deleted:', currentBlockId);
                    
                    // Focus the previous block if it exists, otherwise focus the next block
                    setTimeout(() => {
                      let blockToFocus = null;
                      
                      if (currentIndex > 0) {
                        // Focus previous block
                        const prevBlock = newBlocks[currentIndex - 1];
                        blockToFocus = document.querySelector(`[data-block-id="${prevBlock.clientId}"] textarea, [data-block-id="${prevBlock.clientId}"] input`) as HTMLElement;
                      } else if (newBlocks.length > 0) {
                        // Focus next block (now at currentIndex)
                        const nextBlock = newBlocks[currentIndex];
                        blockToFocus = document.querySelector(`[data-block-id="${nextBlock.clientId}"] textarea, [data-block-id="${nextBlock.clientId}"] input`) as HTMLElement;
                      }
                      
                      if (blockToFocus) {
                        blockToFocus.focus();
                        // Move cursor to end of text
                        if (blockToFocus instanceof HTMLTextAreaElement || blockToFocus instanceof HTMLInputElement) {
                          const length = blockToFocus.value.length;
                          blockToFocus.setSelectionRange(length, length);
                        }
                      }
                    }, 50);
                  }
                }
              }
            }
          }
        }
      }
      
      // Handle image deletion
      if ((selectedImageId || selectedFeaturedImage) && 
          event.target instanceof HTMLElement && 
          !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        
        if (event.key === 'Backspace' || event.key === 'Delete') {
          event.preventDefault();
          
          if (selectedFeaturedImage) {
            // Delete featured image
            setFeaturedImage(null);
            setSelectedFeaturedImage(false);
            console.log('🗑️ Featured image deleted');
          } else if (selectedImageId) {
            // Delete content image block
            const blockToDelete = blocks.find(block => block.clientId === selectedImageId);
            if (blockToDelete) {
              const updatedBlocks = blocks.filter(block => block.clientId !== selectedImageId);
              setBlocks(updatedBlocks);
              setSelectedImageId(null);
              console.log('🗑️ Image block deleted:', selectedImageId);
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageId, selectedFeaturedImage, blocks, setBlocks, setFeaturedImage]);

  // Handle click outside to deselect images
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof HTMLElement) {
        // Check if click is on an image figure element
        const clickedFigure = event.target.closest('figure');
        const isImageClick = clickedFigure && (
          clickedFigure.classList.contains('wp-block-image__figure') || 
          clickedFigure.style.border.includes('#296DEB') ||
          clickedFigure.style.border.includes('2px solid')
        );
        
        // If click is not on an image figure and we have a selected image, deselect it
        if (!isImageClick && (selectedImageId || selectedFeaturedImage || selectedImageElement)) {
          setSelectedImageId(null);
          setSelectedFeaturedImage(false);
          // Also close the image toolbar when deselecting
          setShowImageToolbar(false);
          if (selectedImageElement) {
            selectedImageElement.classList.remove('selected-image');
            setSelectedImageElement(null);
          }
          console.log('🖱️ Image deselected by clicking outside');
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedImageId, selectedFeaturedImage]);

  // Handle image clicks for toolbar
  useEffect(() => {
    console.log('🎯 Setting up image click event listener...');
    
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('👆 Click detected on:', target.tagName, target);
      
      // Check if the clicked element is an image
      if (target.tagName === 'IMG') {
        console.log('🖼️ Image clicked!', target);
        
        // Only target images that are NOT in search results or popups
        const isInInserterPopup = target.closest('.block-editor-inserter__popover');
        const isInModal = target.closest('.components-modal__content');
        const isInSearchResults = target.closest('.block-editor-inserter__search') || 
                                 target.closest('.block-editor-inserter__block-list');
        
        if (isInInserterPopup || isInModal || isInSearchResults) {
          console.log('🚫 Ignoring popup/modal/search result image click');
          return;
        }
        
        // Check if it's within the WordPress editor content
        const isInEditorContent = target.closest('.editor-visual-editor__content') || 
                                 target.closest('.editor-styles-wrapper') ||
                                 target.closest('.block-editor-writing-flow');
        
        // Check if it's a featured image (exclude from toolbar)
        const isFeaturedImage = target.closest('.editor-visual-editor__featured-image-wrapper');
        
        console.log('🔍 Is in editor content:', !!isInEditorContent);
        console.log('🔍 Is featured image:', !!isFeaturedImage);
        console.log('🔍 Available CSS classes on image:', target.className);
        console.log('🔍 Parent elements:', target.parentElement?.tagName, target.parentElement?.className);
        
        if (isInEditorContent && !isFeaturedImage) {
          console.log('✅ Image clicked in WordPress editor!', target);
          
            // Clear ALL previous selections (ensure only one image selected at a time)
            if (selectedImageElement) {
              selectedImageElement.classList.remove('selected-image');
              // Also clear figure selection if it exists
              const figureElement = selectedImageElement.closest('figure');
              if (figureElement) {
                figureElement.classList.remove('selected-image-figure');
              }
            }
            
            // Also clear any existing selections in the DOM (safety cleanup)
            document.querySelectorAll('.selected-image').forEach(el => {
              el.classList.remove('selected-image');
            });
            document.querySelectorAll('.selected-image-figure').forEach(el => {
              el.classList.remove('selected-image-figure');
            });
            
            // Add selection class to the figure (image + caption) if it exists, otherwise just the image
            const imageElement = target as HTMLImageElement;
            const figureElement = imageElement.closest('figure');
            
            if (figureElement) {
              figureElement.classList.add('selected-image-figure');
              console.log('🎯 Selected entire figure (image + caption)');
            } else {
              imageElement.classList.add('selected-image');
              console.log('🎯 Selected image only');
            }
            
            setSelectedImageElement(imageElement);
          
          // Find the matching block for delete functionality
          const imageUrl = imageElement.src;
          console.log('🔍 Searching for block with URL:', imageUrl);
          
          const imageBlocks = blocks.filter(block => block.name === 'core/image');
          console.log('🔍 Available image blocks:', imageBlocks.map(b => ({ 
            clientId: b.clientId, 
            url: b.attributes.url,
            urlMatch: b.attributes.url === imageUrl
          })));
          
          const matchingBlock = imageBlocks.find(block => 
            block.attributes.url === imageUrl ||
            block.attributes.url?.includes(imageUrl.split('/').pop()) ||
            imageUrl.includes(block.attributes.url?.split('/').pop())
          );
          
          if (matchingBlock) {
            setSelectedImageId(matchingBlock.clientId);
            console.log('🎯 Found matching block for delete functionality:', matchingBlock.clientId);
          } else {
            console.log('⚠️ Could not find matching block for delete functionality');
            // Set a fallback ID so we can still try to delete
            setSelectedImageId(imageUrl);
          }
          
          // Position toolbar above the image
          const rect = imageElement.getBoundingClientRect();
          const centerX = rect.left + (rect.width / 2);
          const topY = rect.top + window.scrollY;
          
          setToolbarPosition({ x: centerX, y: topY });
          setShowImageToolbar(true);
          
          console.log('✅ Image selected and toolbar positioned:', { x: centerX, y: topY });
          
          // Prevent event bubbling
          event.stopPropagation();
        }
      }
    };

    // Add event listener to the document
    document.addEventListener('click', handleImageClick, true); // Use capture phase
    console.log('✅ Image click event listener added');
    
    return () => {
      console.log('🧹 Removing image click event listener');
      document.removeEventListener('click', handleImageClick, true);
    };
  }, []);

  const {
    showImageSearch,
    setShowImageSearch,
    searchImages,
    searchLoading,
    selectedSources,
    hasMoreImages,
    lastSearchQuery,
    handleImageSearch,
    handleSourceToggle,
    openImageSearch,
    closeImageSearch
  } = useImageSearch();

  // Featured image search functions
  const handleFeaturedImageSearch = async (query: string, loadMore = false) => {
    if (!query.trim() && !loadMore) return;
    
    setFeaturedImageSearchLoading(true);
    try {
      const searchQuery = loadMore ? featuredImageLastQuery : query;
      if (!loadMore) {
        setFeaturedImageLastQuery(query);
      }
      
      const page = loadMore ? 1 : 1; // Simplified for now
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(searchQuery)}&sources=${featuredImageSelectedSources.join(',')}&page=${page}&perPage=20`);
      const data = await response.json();
      
      if (loadMore) {
        setFeaturedImageSearchImages(prev => [...prev, ...data.images]);
      } else {
        setFeaturedImageSearchImages(data.images);
      }
      setFeaturedImageHasMore(data.hasMore);
    } catch (error) {
      console.error('Featured image search error:', error);
    } finally {
      setFeaturedImageSearchLoading(false);
    }
  };

  const handleFeaturedImageSourceToggle = (source: string) => {
    setFeaturedImageSelectedSources(prev => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const openFeaturedImageSearch = () => {
    setShowFeaturedImageSearch(true);
    setFeaturedImageSearchImages([]);
  };

  const closeFeaturedImageSearch = () => {
    setShowFeaturedImageSearch(false);
    setFeaturedImageSearchImages([]);
    setFeaturedImageLastQuery('');
  };

  // Debug image search modal state changes
  useEffect(() => {
    console.log('🔍 ImageSearchModal state changed:', { 
      showImageSearch,
      imageToReplace: !!imageToReplace,
      selectedImageElement: !!selectedImageElement
    });
  }, [showImageSearch, imageToReplace, selectedImageElement]);

  // Debounced image search function
  const debouncedImageSearch = useMemo(
    () => debounce(async (query: string, page: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setShowImageResults(false);
        setInserterImages([]);
        return;
      }
      
      setShowImageResults(true);
      setInserterLoading(true);
      
      try {
        const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&sources=${selectedSources.join(',')}&page=${page}&perPage=20`);
        const data = await response.json();
        
        if (append) {
          setInserterImages(prev => [...prev, ...data.images]);
        } else {
          setInserterImages(data.images);
        }
        
        setInserterHasMore(data.hasMore);
        setInserterPage(page);
      } catch (error) {
        console.error('Image search error:', error);
      } finally {
        setInserterLoading(false);
      }
    }, 300), // 300ms debounce delay
    [selectedSources]
  );

  // Handle image search from inserter
  const handleInserterImageSearch = async (query: string, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setShowImageResults(false);
      setInserterImages([]);
      return;
    }
    
    setInserterSearchQuery(query);
    setShowImageResults(true);
    setInserterLoading(true);
    
    try {
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&sources=${selectedSources.join(',')}&page=${page}&perPage=20`);
      const data = await response.json();
      
      if (append) {
        setInserterImages(prev => [...prev, ...data.images]);
      } else {
        setInserterImages(data.images);
      }
      
      setInserterHasMore(data.hasMore);
      setInserterPage(page);
    } catch (error) {
      console.error('Image search error:', error);
    } finally {
      setInserterLoading(false);
    }
  };

  // Handle load more images
  const handleLoadMoreImages = () => {
    if (inserterSearchQuery.trim() && !inserterLoading && inserterHasMore) {
      handleInserterImageSearch(inserterSearchQuery, inserterPage + 1, true);
    }
  };

  // Memoized search input handler
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInserterSearchQuery(query);
    if (query.trim()) {
      debouncedImageSearch(query);
    } else {
      setShowImageResults(false);
      setInserterImages([]);
    }
  }, [debouncedImageSearch]);

  // Re-search when selectedSources changes and there's an active search
  useEffect(() => {
    if (inserterSearchQuery.trim() && showImageResults) {
      setInserterPage(1);
      debouncedImageSearch(inserterSearchQuery, 1, false);
    }
  }, [selectedSources, debouncedImageSearch]);

  // Auto-resize textareas on mount and when content changes (for non-paragraph blocks)
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-auto-resize]');
    textareas.forEach((textarea) => {
      const element = textarea as HTMLTextAreaElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    });
  }, [blocks]);

  // Ensure we're on the client side
  useEffect(() => {
    console.log('🌐 Setting isClient to true');
    setIsClient(true);
  }, []);

  // Initialize editor with post data
  useEffect(() => {
    console.log('🔄 Initializing editor', { WordPressComponents: !!WordPressComponents, post: !!post });
    if (!WordPressComponents || !post) {
      console.log('⏳ Waiting for WordPress components or post data');
      return;
    }

    const initializeEditor = async () => {
      console.log('📝 Initializing editor with post data');
      setTitle(post.title || '');
      
      // Load existing featured image if available
      const postWithEmbedded = post as any; // Type assertion for embedded data
      console.log('🔍 Post object for featured image check:', postWithEmbedded);
      console.log('🔍 Post _embedded property:', postWithEmbedded._embedded);
      console.log('🔍 Post featured_media property:', postWithEmbedded.featured_media);
      console.log('🔍 Featured media check:', postWithEmbedded._embedded?.['wp:featuredmedia']?.[0]);
      
      if (postWithEmbedded._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
        const featuredMedia = postWithEmbedded._embedded['wp:featuredmedia'][0];
        setFeaturedImage({
          url: featuredMedia.source_url,
          alt: featuredMedia.alt_text || '',
          caption: featuredMedia.caption?.rendered || '',
          id: featuredMedia.id // Include the WordPress media ID
        });
        console.log('🖼️ Loaded existing featured image:', featuredMedia.source_url, 'with ID:', featuredMedia.id);
      } else if (postWithEmbedded.featured_media && postWithEmbedded.featured_media > 0) {
        console.log('🔍 Post has featured_media ID but no embedded data:', postWithEmbedded.featured_media);
        console.log('⚠️ Featured image data not available in embedded response');
      } else {
        console.log('🔍 No featured image found in post');
      }
      
      if (post.content) {
        try {
          console.log('🔍 Parsing post content...');
          console.log('📄 Raw post content:', post.content);
          console.log('📄 Post content length:', post.content.length);
          const parsedBlocks = WordPressComponents.parse(post.content);
          console.log('✅ Parsed blocks:', parsedBlocks.length);
          console.log('📋 Parsed blocks details:', parsedBlocks);
          
          if (parsedBlocks.length === 0) {
            console.log('⚠️ No blocks parsed - content might be in HTML format, manually converting HTML to blocks');
            // Manually convert HTML to blocks
            try {
              const htmlContent = post.content;
              const manualBlocks = convertHtmlToBlocks(htmlContent);
              console.log('🔧 Manually converted blocks:', manualBlocks.length);
              setBlocks(manualBlocks);
            } catch (error) {
              console.error('❌ Error in manual HTML conversion:', error);
              // Create a default paragraph block
              setBlocks([{
                clientId: `block-${Date.now()}-0`,
                name: 'core/paragraph',
                isValid: true,
                attributes: {
                  content: post.content.replace(/<[^>]*>/g, '') || 'Start writing...',
                  dropCap: false
                },
                innerBlocks: []
              }]);
            }
          } else {
            setBlocks(parsedBlocks);
          }
        } catch (error) {
          console.error('❌ Error parsing post content:', error);
          // Create a default paragraph block
          setBlocks([{
            clientId: `block-${Date.now()}-0`,
            name: 'core/paragraph',
            isValid: true,
            attributes: {
              content: post.content.replace(/<[^>]*>/g, '') || 'Start writing...',
              dropCap: false
            },
            innerBlocks: []
          }]);
        }
      } else {
        // No content, create a default paragraph block
        setBlocks([{
          clientId: `block-${Date.now()}-0`,
          name: 'core/paragraph',
          isValid: true,
          attributes: {
            content: 'Start writing...',
            dropCap: false
          },
          innerBlocks: []
        }]);
      }
      
      console.log('📄 Post object:', post);
    };

    initializeEditor();
  }, [WordPressComponents, post?.id, post?.content, setBlocks, setTitle]);

  // Image handling functions
  const handleImageSelect = (image: any) => {
    // Check if we're replacing an existing image
    if (imageToReplace) {
      console.log('🔄 Replacing existing image, opening crop modal for:', image);
      console.log('🔄 Replacing block ID:', imageToReplace.blockId);
      
    setCurrentImageToCrop(image);
      
      if (imageToReplace.blockId) {
        // Image is in our blocks array - use the existing block ID
        setCurrentBlockId(imageToReplace.blockId);
      } else {
        // Image is not in our blocks array - we'll need to create a new block
        // For now, we'll just replace the image visually and handle the block creation later
        console.log('⚠️ Image not in blocks array - will replace visually only');
        setCurrentBlockId(null);
      }
      
      // Close the block inserter properly
      setShowBlockInserter(false);
      setInserterPosition(null);
      setShowImageResults(false);
      setInserterSearchQuery('');
    setShowImageSearch(false);
    setShowCropModal(true);
      
      // Keep replacement state (will be handled in crop modal)
      // Don't clear imageToReplace here - it's needed in handleCropConfirm
    } else if (inserterPosition) {
      // Normal image insertion flow
      console.log('🖼️ Image selected for cropping:', image);
      console.log('📍 Insertion position:', inserterPosition);
      
      // Set the image for cropping and the target block ID
      setCurrentImageToCrop(image);
      setCurrentBlockId(`block-${Date.now()}-${inserterPosition.index}`);
      setPendingImageInsertion({ index: inserterPosition.index });
      
      // Close the inserter and open crop modal
      setShowBlockInserter(false);
      setInserterPosition(null);
      setShowImageResults(false);
      setInserterSearchQuery('');
      setShowImageSearch(false);
      setShowCropModal(true);
      
    } else {
      // Fallback: just open crop modal
      setCurrentImageToCrop(image);
      setShowImageSearch(false);
      setShowCropModal(true);
    }
  };

  // Featured image handling functions
  const handleFeaturedImageSelect = (image: any) => {
    console.log('🖼️ Featured image selected:', image);
    setCurrentImageToCrop(image);
    setCurrentBlockId('featured-image'); // Special ID for featured image
    setShowFeaturedImageSearch(false);
    setShowCropModal(true);
  };

  const handleCropConfirm = async (croppedImageUrl: string) => {
    if (!currentImageToCrop) return;
    
    try {
      // Create caption with attribution for Unsplash, Pexels, and Wikimedia Commons images
      let imageCaption = '';
      let imageAlt = currentImageToCrop.caption; // Use original caption for alt text
      
      if (currentImageToCrop.attribution && (currentImageToCrop.source === 'unsplash' || currentImageToCrop.source === 'pexels' || currentImageToCrop.source === 'wikiCommons')) {
        imageCaption = currentImageToCrop.attribution; // Show photographer attribution in caption
      }

      // OPTIMISTIC UI: Handle featured image vs body image immediately
      if (currentBlockId === 'featured-image') {
        // Set as featured image immediately with blob URL
        setFeaturedImage({
          url: croppedImageUrl,
          alt: imageAlt,
          caption: imageCaption,
          id: undefined // Will be updated after background upload
        });
        console.log('✅ Featured image set immediately with blob URL');
      } else if (imageToReplace && (!imageToReplace.blockId || imageToReplace.blockId.startsWith('http'))) {
        // Image is not in our blocks array - replace it by deleting old and inserting new
        console.log('🔄 Replacing image by deleting old and inserting new block');
        if (imageToReplace.element) {
          // Update the DOM element immediately for visual feedback
          imageToReplace.element.src = croppedImageUrl;
          imageToReplace.element.alt = imageAlt;
          
          // Update caption if it exists
          const figureElement = imageToReplace.element.closest('figure');
          if (figureElement) {
            const captionElement = figureElement.querySelector('figcaption');
            if (captionElement) {
              captionElement.textContent = imageCaption;
            }
          }
          
          // Find and delete the old image block, then insert new one at same position
          const originalUrl = imageToReplace.blockId && imageToReplace.blockId.startsWith('http') 
            ? imageToReplace.blockId 
            : imageToReplace.element.src;
            
          setBlocks(prevBlocks => {
            // Find the index of the old image block
            const oldBlockIndex = prevBlocks.findIndex(block => 
              block.name === 'core/image' && 
              (block.attributes.url === originalUrl || 
               block.attributes.url?.includes(originalUrl.split('/').pop() || '') ||
               originalUrl.includes(block.attributes.url?.split('/').pop() || ''))
            );
            
            if (oldBlockIndex !== -1) {
              console.log('🔄 Found old block at index:', oldBlockIndex, 'deleting and replacing');
              
              // Create new image block
              const newImageBlock = {
                clientId: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'core/image',
                isValid: true,
                attributes: {
                  url: croppedImageUrl,
                  alt: imageAlt,
                  caption: imageCaption
                },
                innerBlocks: []
              };
              
              // Remove old block and insert new one at same position
              const newBlocks = [...prevBlocks];
              newBlocks.splice(oldBlockIndex, 1, newImageBlock);
              console.log('🔄 Replaced block at index:', oldBlockIndex);
              return newBlocks;
            } else {
              console.log('⚠️ Could not find old block to replace, adding new block at end');
              // Fallback: add new block at end
              const newImageBlock = {
                clientId: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: 'core/image',
                isValid: true,
                attributes: {
                  url: croppedImageUrl,
                  alt: imageAlt,
                  caption: imageCaption
                },
                innerBlocks: []
              };
              return [...prevBlocks, newImageBlock];
            }
          });
        }
      } else {
        // Check if this is a new block insertion or updating an existing block
        const existingBlock = blocks.find(block => block.clientId === currentBlockId);
        
        if (existingBlock) {
          // Update existing block immediately
          setBlocks(prevBlocks => 
            prevBlocks.map(block => 
              block.clientId === currentBlockId 
                ? { ...block, attributes: { ...block.attributes, url: croppedImageUrl, alt: imageAlt, caption: imageCaption } }
                : block
            )
          );
        } else if (currentBlockId) {
          // Insert new image block immediately
          const imageBlock = {
            clientId: currentBlockId,
            name: 'core/image',
            isValid: true,
            attributes: {
              url: croppedImageUrl,
              alt: imageAlt,
              caption: imageCaption
            },
            innerBlocks: []
          };
          
          // Use the pending insertion position or default to end
          const insertionIndex = pendingImageInsertion?.index ?? blocks.length;
          const newBlocks = [...blocks];
          newBlocks.splice(insertionIndex, 0, imageBlock);
          setBlocks(newBlocks);
        }
      }
      
      // Close modal immediately - no waiting for upload
      setShowCropModal(false);
      setCurrentImageToCrop(null);
      const blockIdForUpload = currentBlockId; // Store for background upload
      setCurrentBlockId(null);
      setPendingImageInsertion(null);
      
      // Clear replacement state and selection if we were replacing
      if (imageToReplace) {
        console.log('✅ Image replacement completed, clearing selection and toolbar');
        setImageToReplace(null);
        
        // Clear any existing selection
        if (selectedImageElement) {
          selectedImageElement.classList.remove('selected-image');
          // Also clear figure selection if it exists
          const figureElement = selectedImageElement.closest('figure');
          if (figureElement) {
            figureElement.classList.remove('selected-image-figure');
          }
          setSelectedImageElement(null);
          setSelectedImageId(null);
          setShowImageToolbar(false);
        }
      }

      // Background upload process
      const uploadInBackground = async () => {
        setCropLoading(true);
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        addUploadingImage(uploadId);
        
        try {
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          
          let finalUrl = croppedImageUrl;
          let mediaId = undefined;
          
          // Try to upload to WordPress if available
          if (window.wordPressUpload) {
            try {
              const media = await window.wordPressUpload(file);
              finalUrl = media.source_url;
              mediaId = media.id;
              console.log('✅ Background upload to WordPress completed with media ID:', mediaId);
            } catch (error) {
              console.error('WordPress background upload failed, keeping blob URL:', error);
            }
          } else {
            // Fallback to local upload
            try {
              const formData = new FormData();
              formData.append('image', file);
              const uploadResponse = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
              });
              if (uploadResponse.ok) {
                const result = await uploadResponse.json();
                finalUrl = result.url;
                console.log('✅ Background upload to local server completed:', finalUrl);
              }
            } catch (error) {
              console.error('Local background upload failed, keeping blob URL:', error);
            }
          }

          // Update the media item with caption and alt text if we have a media ID
          if (mediaId && window.wordPressUpdateMedia) {
            try {
              await window.wordPressUpdateMedia(mediaId, {
                caption: imageCaption,
                alt_text: imageAlt
              });
              console.log('✅ Media item updated with caption and alt text');
            } catch (error) {
              console.error('❌ Failed to update media item:', error);
            }
          }

          // Update with final URL only if different from blob URL
          if (finalUrl !== croppedImageUrl) {
            if (blockIdForUpload === 'featured-image') {
              // Update featured image
              setFeaturedImage(prev => prev && prev.url === croppedImageUrl ? {
                ...prev,
                url: finalUrl,
                id: mediaId
              } : prev);
            } else if (imageToReplace && (!imageToReplace.blockId || imageToReplace.blockId.startsWith('http'))) {
              // Update the DOM element directly for images not in blocks array
              if (imageToReplace.element) {
                imageToReplace.element.src = finalUrl;
              }
              
              // Update the blocks array - find the block with the blob URL and update it
              console.log('🔄 Updating blocks array for image replacement:', { finalUrl, croppedImageUrl });
              
              setBlocks(prevBlocks => {
                const updatedBlocks = prevBlocks.map(block => {
                  if (block.name === 'core/image' && block.attributes.url === croppedImageUrl) {
                    console.log('🔄 Found block with blob URL, updating to final URL:', { blobUrl: croppedImageUrl, finalUrl });
                    return {
                      ...block,
                      attributes: {
                        ...block.attributes,
                        url: finalUrl
                      }
                    };
                  }
                  return block;
                });
                
                console.log('🔄 Blocks array updated, checking for blob URLs...');
                const blobUrls = updatedBlocks.filter(block => 
                  block.name === 'core/image' && 
                  block.attributes.url?.startsWith('blob:')
                );
                if (blobUrls.length > 0) {
                  console.log('⚠️ Still have blob URLs in blocks:', blobUrls.map(b => b.attributes.url));
                } else {
                  console.log('✅ No blob URLs found in blocks array');
                }
                
                return updatedBlocks;
              });
            } else {
              // Update content image block
              setBlocks(prevBlocks => 
                prevBlocks.map(block => 
                  block.clientId === blockIdForUpload && block.attributes.url === croppedImageUrl
                    ? { ...block, attributes: { ...block.attributes, url: finalUrl } }
                    : block
                )
              );
            }
          }
        } catch (error) {
          console.error('Background upload error:', error);
          // Image will remain with blob URL, which still works for display
        } finally {
          setCropLoading(false);
          removeUploadingImage(uploadId);
        }
      };

      // Start background upload without blocking UI
      uploadInBackground();
      
    } catch (error) {
      console.error('Error processing cropped image:', error);
      setCropLoading(false);
    }
  };

  // All hooks must be called before any conditional returns
  const blockEditorSettings = useMemo(() => getBlockEditorSettings(), []);

  // Convert our blocks to WordPress format
  const convertBlocksToWordPressFormat = useCallback((blocks: GutenbergBlock[]) => {
    return blocks.map(block => ({
      clientId: block.clientId,
      name: block.name,
      isValid: block.isValid,
      attributes: block.attributes,
      innerBlocks: block.innerBlocks || []
    }));
  }, []);

  const wordPressBlocks = useMemo(() => convertBlocksToWordPressFormat(blocks), [blocks, convertBlocksToWordPressFormat]);

  // Handle block changes
  const handleBlocksChange = useCallback((newBlocks: any) => {
    console.log('🔄 Blocks changed:', newBlocks);
    // Convert back to our format if needed
    setBlocks(newBlocks as GutenbergBlock[]);
  }, [setBlocks]);

  // Handle textarea change with auto-resize (for non-paragraph blocks)
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, blockId: string, attribute: string) => {
    try {
      const target = e.target;
      if (!target || target.value === undefined) {
        console.error('Invalid textarea target:', target);
        return;
      }
      
      // Auto-resize the textarea - add null checks
      if (target.style) {
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
      }
      
      // Update the block
      setBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.clientId === blockId 
            ? { ...b, attributes: { ...b.attributes, [attribute]: target.value } }
            : b
        )
      );
    } catch (error) {
      console.error('Error in handleTextareaChange:', error);
    }
  }, []);

  // Handle backspace deletion for contentEditable elements
  const handleContentEditableKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, blockId: string) => {
    if (e.key === 'Backspace') {
      const element = e.currentTarget;
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const isAtStart = range.startOffset === 0 && range.startContainer === element.firstChild;
        
        // Check if content is empty or only contains whitespace/br tags
        const textContent = element.textContent || '';
        const isEmpty = textContent.trim() === '' || textContent === '';
        
        if (isAtStart && isEmpty) {
          e.preventDefault();
          console.log('🗑️ Deleting contentEditable block:', blockId);
          setBlocks(prevBlocks => prevBlocks.filter(block => block.clientId !== blockId));
        }
      }
    }
  }, [setBlocks]);

  // Show loading while checking client side or loading WordPress components
  if (!isClient || componentsLoading || !WordPressComponents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">
          Loading WordPress Editor... 
          {!isClient && ' (Client)'}
          {componentsLoading && ' (Loading)'}
          {!WordPressComponents && ' (Components)'}
        </span>
      </div>
    );
  }




  return (
    <div className="block-editor__container hide-if-no-js">
      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="interface-interface-skeleton">
        {/* WordPress-style Header */}
        <div className="interface-interface-skeleton__header">
          <div className="editor-header">
            {/* <div className="editor-header__toolbar">
              <div className="editor-document-tools">
                <div className="editor-document-tools__left">
                  <button className="components-button editor-history__undo is-compact has-icon" aria-label="Undo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                      <path d="M18.3 11.7c-.6-.6-1.4-.9-2.3-.9H6.7l2.9-3.3-1.1-1-4.5 5L8.5 16l1-1-2.7-2.7H16c.5 0 .9.2 1.3.5 1 1 1 3.4 1 4.5v.3h1.5v-.2c0-1.5 0-4.3-1.5-5.7z"></path>
                    </svg>
                  </button>
                  <button className="components-button editor-history__redo is-compact has-icon" aria-label="Redo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                      <path d="M15.6 6.5l-1.1 1 2.9 3.3H8c-.9 0-1.7.3-2.3.9-1.4 1.5-1.4 4.2-1.4 5.6v.2h1.5v-.3c0-1.1 0-3.5 1-4.5.3-.3.7-.5 1.3-.5h9.2L14.5 15l1.1 1.1 4.6-4.6-4.6-5z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div> */}
            
            {/* <div className="editor-header__center">
              <div className="editor-document-bar">
                <button className="components-button editor-document-bar__command is-compact">
                  <div className="editor-document-bar__title">
                    <h1 className="editor-document-bar__post-title">{title || 'Untitled'}</h1>
                    <span className="editor-document-bar__post-type-label">· Post</span>
                  </div>
                </button>
              </div>
            </div> */}
            
          </div>
        </div>

        {/* WordPress-style Body */}
        <div className="interface-interface-skeleton__body">
          <div className="interface-interface-skeleton__content">
            <SlotFillProvider>
              <BlockEditorProvider
                value={wordPressBlocks}
                onChange={handleBlocksChange}
                settings={blockEditorSettings}
                useSubRegistry={false}
              >
                {/* WordPress-style Editor Container */}
                <div className="editor-visual-editor">
                  <div className="editor-styles-wrapper block-editor-writing-flow">
                    {/* Spacer for additional top margin */}
                    <div style={{ height: '30px', width: '100%' }}></div>
                    
                    {/* Post Title Input */}
                    <div 
                      className="editor-visual-editor__post-title-wrapper edit-post-visual-editor__post-title-wrapper has-global-padding"
                      style={{
                        maxWidth: '650px',
                        margin: '0 auto',
                        padding: '0 20px'
                      }}
                    >
                      <TitleInput
                        value={title}
                        onChange={setTitle}
                      />
                    </div>

                    {/* 16px spacing between title and featured image */}
                    <div style={{ height: '20px', width: '100%' }}></div>

                    {/* Featured Image Section */}
                    <div 
                      className="editor-visual-editor__featured-image-wrapper"
                      style={{
                        maxWidth: '650px',
                        margin: '20px auto 0 auto',
                        padding: '0 20px'
                      }}
                    >
                      {featuredImage ? (
                        <div className="wp-block-image">
                          <figure 
                            style={{
                              textAlign: 'center',
                              padding: '0',
                              border: selectedFeaturedImage ? '2px solid #296DEB' : '1px solid transparent',
                              borderRadius: '0px',
                              margin: '0',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s ease'
                            }}
                            onClick={() => setSelectedFeaturedImage(!selectedFeaturedImage)}
                          >
                            <div style={{ position: 'relative' }}>
                              <img 
                                src={featuredImage.url} 
                                alt={featuredImage.alt}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  borderRadius: '0px',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  // Add subtle visual indicator for blob URLs (temporary images)
                                  opacity: featuredImage.url.startsWith('blob:') ? 0.95 : 1,
                                  transition: 'opacity 0.3s ease'
                                }}
                              />
                              {/* Subtle upload indicator for blob URLs */}
                              {featuredImage.url.startsWith('blob:') && cropLoading && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '16px',
                                  height: '16px',
                                  backgroundColor: 'rgba(0, 123, 186, 0.8)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    border: '1px solid white',
                                    borderTop: '1px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    transformOrigin: 'center'
                                  }} />
                                </div>
                              )}
                            </div>
                            <figcaption
                              role="textbox"
                              aria-multiline="true"
                              className="block-editor-rich-text__editable wp-element-caption rich-text"
                              aria-label="Image caption text"
                              contentEditable={true}
                              data-wp-block-attribute-key="caption"
                              onInput={(e) => {
                                if (featuredImage) {
                                  setFeaturedImage(prev => prev ? {
                                    ...prev,
                                    caption: e.currentTarget.textContent || ''
                                  } : null);
                                }
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#007cba';
                                e.currentTarget.style.backgroundColor = '#f0f8ff';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              onClick={(e) => e.stopPropagation()}
                              suppressContentEditableWarning={true}
                              style={{ 
                                whiteSpace: 'pre-wrap',
                                minWidth: '1px',
                                textAlign: 'center',
                                color: 'var(--wp--preset--color--contrast)',
                                fontSize: '0.55rem',
                                marginTop: 'var(--wp--preset--spacing--30)',
                                marginBottom: 'var(--wp--style--block-gap)',
                                outline: 'none',
                                border: '1px solid transparent',
                                borderRadius: '2px',
                                padding: '0px 0px',
                                cursor: 'text',
                                backgroundColor: 'transparent',
                                transition: 'border-color 0.2s ease',
                                width: '100%',
                                overflowWrap: 'break-word',
                                lineBreak: 'after-white-space' as any,
                                WebkitNbspMode: 'space' as any,
                                WebkitUserModify: 'read-write' as any
                              } as React.CSSProperties}
                            >
                              {featuredImage.caption || 'Add caption...'}
                            </figcaption>
                          </figure>
                          {selectedFeaturedImage && (
                            <div style={{ 
                              display: 'flex', 
                              gap: '8px', 
                              marginTop: '12px',
                              justifyContent: 'center'
                            }}>
                              <button
                                onClick={() => {
                                  console.log('🖼️ Opening featured image search...');
                                  openFeaturedImageSearch();
                                  // Auto-search for images
                                  handleFeaturedImageSearch('nature');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  backgroundColor: '#0073aa',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Replace Featured Image
                              </button>
                              <button
                                onClick={() => setFeaturedImage(null)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  backgroundColor: '#dc3232',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{
                          border: '2px dashed #ddd',
                          borderRadius: '8px',
                          padding: '40px 20px',
                          textAlign: 'center',
                          backgroundColor: '#f9f9f9'
                        }}>
                          <div style={{ marginBottom: '16px' }}>
                            <svg 
                              width="48" 
                              height="48" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              style={{ margin: '0 auto', color: '#999' }}
                            >
                              <path 
                                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z" 
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '16px', 
                            fontWeight: '500',
                            color: '#333'
                          }}>
                            Set featured image
                          </h3>
                          <p style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '14px', 
                            color: '#666' 
                          }}>
                            Choose an image that represents your content
                          </p>
                          <button
                            onClick={() => {
                              console.log('🖼️ Opening featured image search...');
                              openFeaturedImageSearch();
                              // Auto-search for images
                              handleFeaturedImageSearch('nature');
                            }}
                            style={{
                              padding: '10px 20px',
                              fontSize: '14px',
                              backgroundColor: '#0073aa',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Add Featured Image
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Editor Content using WordPress's official components */}
                    <div 
                      className="is-root-container is-desktop-preview is-layout-constrained wp-block-post-content-is-layout-constrained has-global-padding wp-block-post-content has-global-padding block-editor-block-list__layout"
                        style={{
                          maxWidth: '654px',
                          margin: '0 auto',
                          padding: '0 20px'
                        }}
                    >
                      {/* Custom block list with insertion points */}
                      <div className="block-editor-block-list__layout" data-is-drop-zone="true">
                            {blocks.map((block, index) => (
                              <div key={`${block.clientId}-${block.name}`}>
                                {/* Insertion point before each block */}
                                <div 
                                  className="block-editor-block-list__insertion-point"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                  }}
                                  style={{
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    margin: '4px 0',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease'
                                  }}
                                >
                                  <div style={{
                                    width: '100%',
                                    height: '2px',
                                    backgroundColor: '#007cba',
                                    borderRadius: '1px',
                                    position: 'relative'
                                  }}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = rect.left + rect.width / 2;
                                        const clickY = rect.top;
                                        const { popupX, popupY } = calculatePopupPosition();
                                        
                                        setInserterPosition({ 
                                          index, 
                                          x: clickX, 
                                          y: clickY,
                                          popupX,
                                          popupY
                                        });
                                        setShowBlockInserter(true);
                                        setShowImageResults(false);
                                        setInserterSearchQuery('');
                                        setPendingImageInsertion(null);
                                        setInserterImages([]);
                                        setInserterPage(1);
                                        setInserterHasMore(false);
                                      }}
                                      style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: '#007cba',
                                        borderRadius: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 8px rgba(0, 0, 170, 0.3)'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#0000ff';
                                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 170, 0.5)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#007cba';
                                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 170, 0.3)';
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Block content */}
                                <div style={{ marginBottom: '0px' }} data-block-id={block.clientId}>
                                  {block.name === 'core/paragraph' && (
                                    <RichTextParagraph
                                      key={`paragraph-${block.clientId}`}
                                      content={block.attributes.content || ''}
                                      clientId={block.clientId}
                                      onChange={(content) => {
                                        setBlocks(prevBlocks =>
                                          prevBlocks.map(b =>
                                            b.clientId === block.clientId 
                                              ? { ...b, attributes: { ...b.attributes, content } }
                                              : b
                                          )
                                        );
                                      }}
                                      onDelete={() => {
                                        setBlocks(prevBlocks => prevBlocks.filter(prevBlock => prevBlock.clientId !== block.clientId));
                                      }}
                                      placeholder="Start writing..."
                                    />
                                  )}

                                  {block.name === 'core/heading' && (
                                    <ContentEditableHeading
                                      key={`heading-${block.clientId}`}
                                      block={block}
                                      onContentChange={(content) => handleTextareaChange({ target: { value: content } } as any, block.clientId, 'content')}
                                      onDelete={() => setBlocks(prevBlocks => prevBlocks.filter(prevBlock => prevBlock.clientId !== block.clientId))}
                                    />
                                  )}

                                  {block.name === 'core/image' && (
                                    <figure 
                                      style={{ 
                                        textAlign: 'center', 
                                        padding: '0', 
                                        border: selectedImageId === block.clientId ? '2px solid #296DEB' : '1px solid transparent', 
                                        borderRadius: '4px', 
                                        margin: '0',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease'
                                      }}
                                      onClick={() => setSelectedImageId(selectedImageId === block.clientId ? null : block.clientId)}
                                    >
                                      {block.attributes.url ? (
                                        <div style={{ position: 'relative' }}>
                                          <img 
                                            src={block.attributes.url} 
                                            alt={block.attributes.alt || ''} 
                                            style={{ 
                                              maxWidth: '100%', 
                                              height: 'auto', 
                                              display: 'block', 
                                              margin: '0 auto',
                                              // Add subtle visual indicator for blob URLs (temporary images)
                                              opacity: block.attributes.url.startsWith('blob:') ? 0.95 : 1,
                                              transition: 'opacity 0.3s ease'
                                            }}
                                          />
                                          {/* Subtle upload indicator for blob URLs */}
                                          {block.attributes.url.startsWith('blob:') && cropLoading && (
                                            <div style={{
                                              position: 'absolute',
                                              top: '8px',
                                              right: '8px',
                                              width: '16px',
                                              height: '16px',
                                              backgroundColor: 'rgba(0, 123, 186, 0.8)',
                                              borderRadius: '50%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                              <div style={{
                                                width: '8px',
                                                height: '8px',
                                                border: '1px solid white',
                                                borderTop: '1px solid transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                              }} />
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div style={{ 
                                          border: '2px dashed #ccc', 
                                          padding: '40px', 
                                          textAlign: 'center',
                                          backgroundColor: '#f9f9f9',
                                          color: '#666'
                                        }}>
                                          No image selected
                                        </div>
                                      )}
                                      <figcaption
                                        role="textbox"
                                        aria-multiline="true"
                                        className="block-editor-rich-text__editable wp-element-caption rich-text"
                                        aria-label="Image caption text"
                                        contentEditable={true}
                                        data-wp-block-attribute-key="caption"
                                        onInput={(e) => {
                                          updateBlock(block.clientId, { caption: e.currentTarget.textContent || '' });
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.style.borderColor = '#007cba';
                                          e.currentTarget.style.backgroundColor = '#f0f8ff';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.style.borderColor = 'transparent';
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        suppressContentEditableWarning={true}
                                        style={{ 
                                          whiteSpace: 'pre-wrap',
                                          minWidth: '1px',
                                          textAlign: 'center',
                                          color: 'var(--wp--preset--color--contrast)',
                                          fontSize: '0.55rem',
                                          marginTop: 'var(--wp--preset--spacing--30)',
                                          marginBottom: 'var(--wp--style--block-gap)',
                                          outline: 'none',
                                          border: '1px solid transparent',
                                          borderRadius: '2px',
                                          padding: '0px 0px',
                                          cursor: 'text',
                                          backgroundColor: 'transparent',
                                          transition: 'border-color 0.2s ease',
                                          width: '100%',
                                          overflowWrap: 'break-word',
                                          lineBreak: 'after-white-space' as any,
                                          WebkitNbspMode: 'space' as any,
                                          WebkitUserModify: 'read-write' as any
                                        } as React.CSSProperties}
                                      >
                                        {block.attributes.caption || 'Add caption...'}
                                      </figcaption>
                                    </figure>
                                  )}

                                  {block.name === 'core/list' && (
                                    <textarea
                                      value={block.attributes.values || '<li>List item</li>'}
                                      onChange={(e) => handleTextareaChange(e, block.clientId, 'values')}
                                      data-auto-resize
                                      style={{
                                        outline: 'none',
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        width: '100%',
                                        fontSize: 'var(--wp--preset--font-size--medium)',
                                        lineHeight: '1.5',
                                        padding: '8px 8px 8px 1.5em',
                                        borderRadius: '4px',
                                        resize: 'none',
                                        overflow: 'hidden',
                                        minHeight: '2em'
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      placeholder="<li>List item</li>"
                                    />
                                  )}

                                  {block.name === 'core/quote' && (
                                    <blockquote style={{ 
                                      borderLeft: '4px solid var(--wp--preset--color--primary)',
                                      paddingLeft: 'var(--wp--preset--spacing--40)',
                                      margin: 'var(--wp--style--block-gap) 0',
                                      fontStyle: 'italic',
                                      fontSize: 'var(--wp--preset--font-size--medium)',
                                      lineHeight: '1.6',
                                      padding: '8px',
                                      border: '1px solid transparent',
                                      borderRadius: '4px'
                                    }}>
                                      <textarea
                                        value={block.attributes.value || '<p>Quote text</p>'}
                                        onChange={(e) => handleTextareaChange(e, block.clientId, 'value')}
                                        data-auto-resize
                                        style={{
                                          outline: 'none',
                                          border: 'none',
                                          background: 'transparent',
                                          width: '100%',
                                          margin: '0',
                                          resize: 'none',
                                          overflow: 'hidden',
                                          minHeight: '2em'
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.parentElement!.style.border = '1px solid #007cba';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.parentElement!.style.border = '1px solid transparent';
                                        }}
                                        placeholder="<p>Quote text</p>"
                                      />
                                      {block.attributes.citation && (
                                        <cite style={{ 
                                          display: 'block',
                                          marginTop: 'var(--wp--preset--spacing--30)',
                                          fontSize: 'var(--wp--preset--font-size--small)',
                                          fontStyle: 'normal'
                                        }}>
                                          — {block.attributes.citation}
                                        </cite>
                                      )}
                                    </blockquote>
                                  )}

                                  {block.name === 'core/separator' && (
                                    <hr style={{ 
                                      border: 'none',
                                      borderTop: '1px solid #ddd',
                                      margin: '2em 0',
                                      height: '1px'
                                    }} />
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Insertion point after the last block */}
                              <div 
                                className="block-editor-block-list__insertion-point"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.6';
                                }}
                                style={{
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  margin: '4px 0',
                                  opacity: 0.6,
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <div style={{
                                  width: '100%',
                                  height: '2px',
                                  backgroundColor: '#007cba',
                                  borderRadius: '1px',
                                  position: 'relative'
                                }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const clickX = rect.left + rect.width / 2;
                                      const clickY = rect.top;
                                      const { popupX, popupY } = calculatePopupPosition();
                                      
                                      setInserterPosition({ 
                                        index: blocks.length, 
                                        x: clickX, 
                                        y: clickY,
                                        popupX,
                                        popupY
                                      });
                                      setShowBlockInserter(true);
                                      setShowImageResults(false);
                                      setInserterSearchQuery('');
                                      setPendingImageInsertion(null);
                                      setInserterImages([]);
                                      setInserterPage(1);
                                      setInserterHasMore(false);
                                    }}
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: '#007cba',
                                      borderRadius: '0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 2px 8px rgba(0, 0, 170, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#0000ff';
                                      e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 170, 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#007cba';
                                      e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 170, 0.3)';
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlockEditorProvider>
            </SlotFillProvider>
          </div>
        </div>
      </div>

      {/* Block Inserter Popover */}
      {showBlockInserter && inserterPosition && (
        <div
          className="components-popover block-editor-inserter__popover"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000000,
            width: '900px',
            maxWidth: '90vw',
            boxShadow: '0 3px 30px rgba(25, 30, 35, 0.2)',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            padding: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
          }}
        >
          <div className="block-editor-inserter__quick-inserter">
            <div className="block-editor-inserter__search" style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search for an image..."
                value={inserterSearchQuery}
                onChange={handleSearchInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#007cba'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              />
            </div>

            {/* API Selection Buttons */}
            <div className="block-editor-inserter__block-list" style={{ marginBottom: '8px' }}>
              <div className="block-editor-block-types-list">
                <div 
                  className="block-editor-block-types-list__item" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    cursor: 'pointer', 
                    border: '1px solid transparent', 
                    borderRadius: '4px', 
                    marginBottom: '2px', 
                    transition: '0.2s',
                    backgroundColor: selectedSources.includes('unsplash') ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleSourceToggle('unsplash')}
                  onMouseEnter={(e) => {
                    if (!selectedSources.includes('unsplash')) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedSources.includes('unsplash')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Unsplash</div>
                </div>
                
                <div 
                  className="block-editor-block-types-list__item" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    cursor: 'pointer', 
                    border: '1px solid transparent', 
                    borderRadius: '4px', 
                    marginBottom: '2px', 
                    transition: '0.2s',
                    backgroundColor: selectedSources.includes('pexels') ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleSourceToggle('pexels')}
                  onMouseEnter={(e) => {
                    if (!selectedSources.includes('pexels')) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedSources.includes('pexels')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Pexels</div>
                </div>
                
                <div 
                  className="block-editor-block-types-list__item" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    cursor: 'pointer', 
                    border: '1px solid transparent', 
                    borderRadius: '4px', 
                    marginBottom: '2px', 
                    transition: '0.2s',
                    backgroundColor: selectedSources.includes('wikiCommons') ? '#e3f2fd' : 'transparent'
                  }}
                  onClick={() => handleSourceToggle('wikiCommons')}
                  onMouseEnter={(e) => {
                    if (!selectedSources.includes('wikiCommons')) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedSources.includes('wikiCommons')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Wiki Commons</div>
                </div>
              </div>
            </div>
            
            <div className="block-editor-inserter__block-list">
              {showImageResults && inserterImages.length > 0 ? (
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#1e1e1e', 
                    marginBottom: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    {`Image Results for "${inserterSearchQuery}"`}
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                    gap: '12px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    {inserterImages.map((image, index) => (
                      <div
                        key={`${image.url}-${index}`}
                        onClick={() => handleInserterImageSelect(image)}
                        style={{
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#007cba';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#ddd';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <img
                          src={image.thumbnail || image.url}
                          alt={image.caption || 'Image'}
                          style={{
                            width: '100%',
                            height: '160px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <div style={{
                          padding: '4px 6px',
                          fontSize: '10px',
                          color: '#666',
                          lineHeight: '1.2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {image.attribution || image.caption || 'Image'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {inserterHasMore && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '12px',
                      padding: '8px 0',
                      borderTop: '1px solid #e0e0e0'
                    }}>
                      <button
                        onClick={handleLoadMoreImages}
                        disabled={inserterLoading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: inserterLoading ? '#f5f5f5' : '#007cba',
                          color: inserterLoading ? '#999' : 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: inserterLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!inserterLoading) {
                            e.currentTarget.style.backgroundColor = '#005a87';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!inserterLoading) {
                            e.currentTarget.style.backgroundColor = '#007cba';
                          }
                        }}
                      >
                        {inserterLoading ? 'Loading...' : 'Load More Images'}
                      </button>
                    </div>
                  )}
                </div>
              ) : showImageResults && inserterLoading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  color: '#666'
                }}>
                  Searching for images...
                </div>
              ) : showImageResults && inserterImages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  color: '#666'
                }}>
                  {`No images found for "${inserterSearchQuery}"`}
                </div>
              ) : (
                <div className="block-editor-block-types-list" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  padding: '16px'
                }}>
                  {blockTypes.map((blockType) => (
                    <div
                      key={blockType.name}
                      className="block-editor-block-types-list__item"
                      onClick={() => handleInsertBlock(blockType.name, inserterPosition.index)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '16px 12px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        minHeight: '100px',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.borderColor = '#007cba';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <span className="block-editor-block-types-list__item-icon" style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="block-editor-block-icon has-colors">
                          {blockType.icon}
                        </span>
                      </span>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        width: '100%'
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px', 
                          color: '#1e1e1e',
                          textAlign: 'center'
                        }}>
                          {blockType.title}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#757575',
                          lineHeight: '1.3',
                          textAlign: 'center',
                          maxWidth: '100%',
                          wordWrap: 'break-word'
                        }}>
                          {blockType.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Image Toolbar */}
      <SimpleImageToolbar
        isVisible={showImageToolbar}
        position={toolbarPosition}
        onClose={() => {
          setShowImageToolbar(false);
          if (selectedImageElement) {
            selectedImageElement.classList.remove('selected-image');
            // Also clear figure selection if it exists
            const figureElement = selectedImageElement.closest('figure');
            if (figureElement) {
              figureElement.classList.remove('selected-image-figure');
            }
            setSelectedImageElement(null);
          }
          setSelectedImageId(null);
        }}
        onDelete={() => {
          if (selectedImageElement && selectedImageId) {
            // Try to delete by block ID first
            const blockToDelete = blocks.find(block => block.clientId === selectedImageId);
            
            if (blockToDelete) {
              // Delete by block ID (preferred method)
              const updatedBlocks = blocks.filter(block => block.clientId !== selectedImageId);
              setBlocks(updatedBlocks);
              console.log('🗑️ Image block deleted by ID:', selectedImageId);
            } else {
              // Fallback: delete by image URL matching
              const imageUrl = selectedImageElement.src;
              const updatedBlocks = blocks.filter(block => 
                !(block.name === 'core/image' && (
                  block.attributes.url === imageUrl ||
                  block.attributes.url?.includes(imageUrl.split('/').pop()) ||
                  imageUrl.includes(block.attributes.url?.split('/').pop())
                ))
              );
              setBlocks(updatedBlocks);
              console.log('🗑️ Image block deleted by URL matching:', imageUrl);
            }
            
            // Clear selection and close toolbar
            selectedImageElement.classList.remove('selected-image');
            // Also clear figure selection if it exists
            const figureElement = selectedImageElement.closest('figure');
            if (figureElement) {
              figureElement.classList.remove('selected-image-figure');
            }
            setSelectedImageElement(null);
            setSelectedImageId(null);
            setShowImageToolbar(false);
          }
        }}
        onReplace={() => {
          console.log('🔄 Replace button clicked!', { selectedImageElement: !!selectedImageElement, selectedImageId });
          if (selectedImageElement) {
            console.log('🔄 Replace button clicked, opening image search');
            console.log('🔄 Setting imageToReplace:', { element: selectedImageElement, blockId: selectedImageId });
            setImageToReplace({ 
              element: selectedImageElement, 
              blockId: selectedImageId 
            });
            console.log('🔄 Setting showImageSearch to true');
            setShowImageSearch(true);
            setShowImageToolbar(false); // Close toolbar when opening search
            console.log('🔄 Image search modal should now be visible');
          } else {
            console.log('⚠️ No selectedImageElement, cannot replace');
          }
        }}
      />

      {/* Image Search Modal - only render when needed */}
      {showImageSearch && (
        <ImageSearchModal
          isOpen={showImageSearch}
          onClose={() => {
            closeImageSearch();
            // Clear replacement state if modal is closed during replacement
            if (imageToReplace) {
              console.log('🔄 Image search closed during replacement, clearing state');
              setImageToReplace(null);
              // Restore selection if we were replacing
              if (selectedImageElement) {
                setShowImageToolbar(true);
              }
            }
          }}
          onSelect={handleImageSelect}
          selectedSources={selectedSources}
          onSourceToggle={handleSourceToggle}
          onSearch={handleImageSearch}
          images={searchImages}
          loading={searchLoading}
          hasMore={hasMoreImages}
          loadMore={() => handleImageSearch(lastSearchQuery, true)}
        />
      )}
      
      {/* Crop Modal */}
      <CropModal
        isOpen={showCropModal}
        imageSrc={currentImageToCrop?.full || currentImageToCrop?.url || ''}
        onCancel={() => {
          setShowCropModal(false);
          setCurrentImageToCrop(null);
          setCurrentBlockId(null);
          setPendingImageInsertion(null);
          setCropLoading(false);
        }}
        onConfirm={handleCropConfirm}
        loading={false}
      />

      {/* Featured Image Search Modal - only render when needed */}
      {showFeaturedImageSearch && (
      <ImageSearchModal
        isOpen={showFeaturedImageSearch}
        onClose={closeFeaturedImageSearch}
        onSelect={handleFeaturedImageSelect}
        selectedSources={featuredImageSelectedSources}
        onSourceToggle={handleFeaturedImageSourceToggle}
        onSearch={handleFeaturedImageSearch}
        images={featuredImageSearchImages}
        loading={featuredImageSearchLoading}
        hasMore={featuredImageHasMore}
        loadMore={() => handleFeaturedImageSearch(featuredImageLastQuery, true)}
      />
      )}
    </div>
  );
});

WordPressBlockEditor.displayName = 'WordPressBlockEditor';

export default WordPressBlockEditor;

