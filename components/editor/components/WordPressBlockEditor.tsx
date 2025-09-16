'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ClientOnlyGutenbergEditorProps, GutenbergBlock } from '../types';
import { useWordPressComponents } from '../hooks/useWordPressComponents';
import { useBlockManagement } from '../hooks/useBlockManagement';
import { useImageSearch } from '../hooks/useImageSearch';
import { convertHtmlToBlocks } from '../utils/htmlParser';
import { getBlockEditorSettings } from '../utils/blockEditorSettings';

// Import existing components
import ImageSearchModal from '../../ImageSearchModal';
import CropModal from '../../CropModal';

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

function WordPressBlockEditor({ 
  post, 
  onSave, 
  onCancel 
}: ClientOnlyGutenbergEditorProps) {
  console.log('🚀 WordPressBlockEditor rendered', { post: !!post, onSave: !!onSave, onCancel: !!onCancel });
  
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
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedFeaturedImage, setSelectedFeaturedImage] = useState<boolean>(false);
  // Featured image search state - using same hook as body images
  const {
    showImageSearch: showFeaturedImageSearch,
    setShowImageSearch: setShowFeaturedImageSearch,
    searchImages: featuredImageSearchImages,
    searchLoading: featuredImageSearchLoading,
    selectedSources: featuredImageSelectedSources,
    hasMoreImages: featuredImageHasMore,
    lastSearchQuery: featuredImageLastQuery,
    handleImageSearch: handleFeaturedImageSearch,
    handleSourceToggle: handleFeaturedImageSourceToggle,
    openImageSearch: openFeaturedImageSearch,
    closeImageSearch: closeFeaturedImageSearch
  } = useImageSearch();

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

  // Position popup at the top of the content container
  const calculatePopupPosition = () => {
    const popupWidth = 900;
    const margin = 20;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    
    // Calculate horizontal position (centered)
    let popupX = (viewportWidth - popupWidth) / 2;
    
    // Ensure popup doesn't go off the edges
    if (popupX < margin) {
      popupX = margin;
    }
    if (popupX + popupWidth > viewportWidth - margin) {
      popupX = viewportWidth - popupWidth - margin;
    }
    
    // Position at the top of the content area
    const popupY = 100; // Fixed position from top of viewport
    
    return { popupX, popupY };
  };

  // Handle block insertion
  const handleInsertBlock = (blockType: string, index: number) => {
    console.log('Inserting block:', blockType, 'at index:', index);
    
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
    setShowCropModal(true);
    
    console.log('🎬 Crop modal should now be open');
  };

  // Handle click outside to close inserter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    };

    if (showBlockInserter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBlockInserter]);

  // Handle window resize to reposition popup
  useEffect(() => {
    const handleResize = () => {
      if (showBlockInserter && inserterPosition) {
        const { popupX, popupY } = calculatePopupPosition();
        setInserterPosition(prev => prev ? { ...prev, popupX, popupY } : null);
      }
    };

    if (showBlockInserter) {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showBlockInserter, inserterPosition]);

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
        if (!isImageClick && (selectedImageId || selectedFeaturedImage)) {
          setSelectedImageId(null);
          setSelectedFeaturedImage(false);
          console.log('🖱️ Image deselected by clicking outside');
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedImageId, selectedFeaturedImage]);

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

  // Auto-resize textareas on mount and when content changes
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
    setCurrentImageToCrop(image);
    setShowImageSearch(false);
    setShowCropModal(true);
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
    if (!currentImageToCrop || !currentBlockId) return;
    
    setCropLoading(true);
    try {
      // Upload the cropped image
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      let finalUrl = croppedImageUrl;
      
      // Try to upload to WordPress if available
      let mediaId = undefined;
      if (window.wordPressUpload) {
        try {
          const media = await window.wordPressUpload(file);
          finalUrl = media.source_url;
          mediaId = media.id;
          console.log('✅ Image uploaded to WordPress with media ID:', mediaId);
        } catch (error) {
          console.error('WordPress upload failed, using local URL:', error);
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
          }
        } catch (error) {
          console.error('Local upload failed:', error);
        }
      }
      
      // Create caption with attribution for Unsplash, Pexels, and Wikimedia Commons images
      let imageCaption = '';
      let imageAlt = currentImageToCrop.caption; // Use original caption for alt text
      
      if (currentImageToCrop.attribution && (currentImageToCrop.source === 'unsplash' || currentImageToCrop.source === 'pexels' || currentImageToCrop.source === 'wikiCommons')) {
        imageCaption = currentImageToCrop.attribution; // Show photographer attribution in caption
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

      // Handle featured image vs body image
      if (currentBlockId === 'featured-image') {
        // Set as featured image
        setFeaturedImage({
          url: finalUrl,
          alt: imageAlt,
          caption: imageCaption,
          id: mediaId // Use the media ID from WordPress upload
        });
        console.log('✅ Featured image uploaded and set:', finalUrl, 'with media ID:', mediaId);
      } else {
        // Check if this is a new block insertion or updating an existing block
        const existingBlock = blocks.find(block => block.clientId === currentBlockId);
        
        if (existingBlock) {
          // Update existing block
        setBlocks(prevBlocks => 
          prevBlocks.map(block => 
            block.clientId === currentBlockId 
              ? { ...block, attributes: { ...block.attributes, url: finalUrl, alt: imageAlt, caption: imageCaption } }
              : block
          )
        );
        } else {
          // Insert new image block
          const imageBlock = {
            clientId: currentBlockId,
            name: 'core/image',
            isValid: true,
            attributes: {
              url: finalUrl,
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
      
      setShowCropModal(false);
      setCurrentImageToCrop(null);
      setCurrentBlockId(null);
      setPendingImageInsertion(null);
    } catch (error) {
      console.error('Error processing cropped image:', error);
    } finally {
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

  // Auto-resize textareas to match contentEditable behavior
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, []);

  // Handle textarea change with auto-resize
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>, blockId: string, attribute: string) => {
    try {
      const target = e.target;
      if (!target || target.value === undefined) {
        console.error('Invalid textarea target:', target);
        return;
      }
      
      // Auto-resize the textarea
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
      
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

  // Debug: Log blocks before rendering
  console.log('🔍 Blocks before rendering:', blocks);
  console.log('🔍 Block count:', blocks.length);
  console.log('🔍 First few blocks:', blocks.slice(0, 3));
  
  // Debug: Log WordPress blocks format
  console.log('🔍 WordPress blocks format:', wordPressBlocks);
  console.log('🔍 WordPress blocks count:', wordPressBlocks.length);
  console.log('🔍 First WordPress block:', wordPressBlocks[0]);



  return (
    <div className="block-editor__container hide-if-no-js">
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
            
            <div className="editor-header__settings">
              <button 
                onClick={handleSave}
                className="components-button editor-post-publish-button editor-post-publish-button__button is-primary is-compact"
              >
                Save
              </button>
              <button 
                onClick={onCancel}
                className="components-button is-compact"
              >
                Cancel
              </button>
            </div>
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
                    {/* Post Title Input */}
                    <div 
                      className="editor-visual-editor__post-title-wrapper edit-post-visual-editor__post-title-wrapper has-global-padding"
                      style={{
                        maxWidth: '650px',
                        margin: '33px auto 0 auto',
                        padding: '0 20px'
                      }}
                    >
                      <input
                        type="text"
                        value={title || ''}
                        onChange={(e) => setTitle(e.target.value)}
                        className="wp-block wp-block-post-title block-editor-block-list__block editor-post-title editor-post-title__input rich-text"
                        aria-label="Add title"
                        placeholder="Add title"
                        style={{ 
                          fontSize: 'var(--wp--preset--font-size--x-large)',
                          fontWeight: 'bold',
                          lineHeight: '1.2',
                          margin: '0',
                          padding: '0',
                          border: 'none',
                          outline: 'none',
                          backgroundColor: 'transparent',
                          textAlign: 'left',
                          minHeight: '1.2em',
                          width: '100%'
                        }}
                      />
                    </div>

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
                              borderRadius: '4px',
                              margin: '0',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s ease'
                            }}
                            onClick={() => setSelectedFeaturedImage(!selectedFeaturedImage)}
                          >
                            <img 
                              src={featuredImage.url} 
                              alt={featuredImage.alt}
                              style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                            />
                            <input
                              type="text"
                              value={featuredImage.caption || ''}
                              onChange={(e) => {
                                if (featuredImage) {
                                  setFeaturedImage(prev => prev ? {
                                    ...prev,
                                    caption: e.target.value
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
                              placeholder="Add caption..."
                              style={{ 
                                fontSize: '0.579rem',
                                color: 'var(--wp--preset--color--contrast)',
                                marginTop: 'var(--wp--preset--spacing--30)',
                                textAlign: 'center',
                                outline: 'none',
                                border: '1px solid transparent',
                                borderRadius: '2px',
                                padding: '4px 8px',
                                minHeight: '20px',
                                cursor: 'text',
                                backgroundColor: 'transparent',
                                transition: 'border-color 0.2s ease',
                                width: '100%'
                              }}
                            />
                          </figure>
                          <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            marginTop: '12px',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => {
                                console.log('🖼️ Opening featured image search...');
                                openFeaturedImageSearch('featured-image');
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
                              Change Image
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
                              openFeaturedImageSearch('featured-image');
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
                                  onClick={(e) => {
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
                                  }}
                                />
                                
                                {/* Block content */}
                                <div style={{ marginBottom: '4px' }} data-block-id={block.clientId}>
                                  {block.name === 'core/paragraph' && (
                                    <textarea
                                      key={`paragraph-${block.clientId}`}
                                      value={block.attributes.content || ''}
                                      onChange={(e) => handleTextareaChange(e, block.clientId, 'content')}
                                      data-auto-resize
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      placeholder="Start writing..."
                                      style={{
                                        minHeight: '1.5em',
                                        outline: 'none',
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        width: '100%',
                                        fontSize: 'var(--wp--preset--font-size--medium)',
                                        lineHeight: '1.5',
                                        padding: '0px 0px',
                                        borderRadius: '2px',
                                        direction: 'ltr',
                                        unicodeBidi: 'normal',
                                        margin: '0',
                                        resize: 'none',
                                        overflow: 'hidden'
                                      }}
                                    />
                                  )}

                                  {block.name === 'core/heading' && (
                                    <input
                                      key={`heading-${block.clientId}`}
                                      type="text"
                                      value={block.attributes.content || ''}
                                      onChange={(e) => {
                                        setBlocks(prevBlocks =>
                                          prevBlocks.map(b =>
                                            b.clientId === block.clientId 
                                              ? { ...b, attributes: { ...b.attributes, content: e.target.value } }
                                              : b
                                          )
                                        );
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      placeholder="Heading"
                                      style={{
                                        minHeight: '1.2em',
                                        outline: 'none',
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        width: '100%',
                                        fontSize: 'var(--wp--preset--font-size--large)',
                                        fontWeight: '800',
                                        lineHeight: '1.2',
                                        margin: '0',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        direction: 'ltr',
                                        unicodeBidi: 'normal'
                                      }}
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
                                        <img 
                                          src={block.attributes.url} 
                                          alt={block.attributes.alt || ''} 
                                          style={{ 
                                            maxWidth: '100%', 
                                            height: 'auto', 
                                            display: 'block', 
                                            margin: '0 auto'
                                          }}
                                        />
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
                                      <input
                                        type="text"
                                        value={block.attributes.caption || ''}
                                        onChange={(e) => {
                                          updateBlock(block.clientId, { caption: e.target.value });
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
                                        placeholder="Add caption..."
                                        style={{ 
                                          fontSize: '0.579rem',
                                          color: 'var(--wp--preset--color--contrast)',
                                          marginTop: 'var(--wp--preset--spacing--30)',
                                          textAlign: 'center',
                                          outline: 'none',
                                          border: '1px solid transparent',
                                          borderRadius: '2px',
                                          padding: '4px 8px',
                                          minHeight: '20px',
                                          cursor: 'text',
                                          backgroundColor: 'transparent',
                                          transition: 'border-color 0.2s ease',
                                          width: '100%'
                                        }}
                                      />
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
                              onClick={(e) => {
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
                              }}
                            />
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
            top: inserterPosition.popupY,
            left: inserterPosition.popupX,
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
                    Image Results for "{inserterSearchQuery}"
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
                  No images found for "{inserterSearchQuery}"
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


      {/* Image Search Modal */}
      <ImageSearchModal
        isOpen={showImageSearch}
        onClose={closeImageSearch}
        onSelect={handleImageSelect}
        selectedSources={selectedSources}
        onSourceToggle={handleSourceToggle}
        onSearch={handleImageSearch}
        images={searchImages}
        loading={searchLoading}
        hasMore={hasMoreImages}
        loadMore={() => handleImageSearch(lastSearchQuery, true)}
      />
      
      {/* Crop Modal */}
      <CropModal
        isOpen={showCropModal}
        imageSrc={currentImageToCrop?.full || currentImageToCrop?.url || ''}
        onCancel={() => {
          console.log('❌ Crop modal cancelled');
          setShowCropModal(false);
          setCurrentImageToCrop(null);
          setCurrentBlockId(null);
          setPendingImageInsertion(null);
          setCropLoading(false);
        }}
        onConfirm={handleCropConfirm}
        loading={cropLoading}
      />

      {/* Featured Image Search Modal */}
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
    </div>
  );
}

export default WordPressBlockEditor;
