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

  // Block types for inserter
  const blockTypes = [
    { name: 'core/paragraph', title: 'Paragraph', icon: '📝', description: 'Start with the building block of all narrative.' },
    { name: 'core/heading', title: 'Heading', icon: '📰', description: 'Introduce new sections and organize content.' },
    { name: 'core/image', title: 'Image', icon: '🖼️', description: 'Insert an image to make a visual statement.' },
    { name: 'core/list', title: 'List', icon: '📋', description: 'Create a bulleted or numbered list.' },
    { name: 'core/quote', title: 'Quote', icon: '💬', description: 'Give quoted text visual emphasis.' },
    { name: 'core/separator', title: 'Separator', icon: '➖', description: 'Create a break between ideas or sections.' },
  ];

  // Position popup at the top of the content container
  const calculatePopupPosition = () => {
    const popupWidth = 650;
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
    handleSave, 
    addBlock,
    updateBlock
  } = useBlockManagement(post, onSave);
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

  // Re-search when selectedSources changes and there's an active search
  useEffect(() => {
    if (inserterSearchQuery.trim() && showImageResults) {
      setInserterPage(1);
      handleInserterImageSearch(inserterSearchQuery, 1, false);
    }
  }, [selectedSources, inserterSearchQuery, showImageResults]);

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
      if (window.wordPressUpload) {
        try {
          const media = await window.wordPressUpload(file);
          finalUrl = media.source_url;
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

  // Refs for tracking cursor position and preventing re-renders
  const cursorPositionRef = useRef<{ [key: string]: number }>({});
  const isUpdatingRef = useRef<{ [key: string]: boolean }>({});

  // Handle paragraph input changes with optimized cursor preservation
  const handleParagraphInput = useCallback((blockId: string, newContent: string, element: HTMLElement) => {
    // Prevent updates during React re-renders
    if (isUpdatingRef.current[blockId]) return;
    
    // Save cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPositionRef.current[blockId] = range.startOffset;
    }

    // Update blocks state
    setBlocks(prevBlocks =>
      prevBlocks.map(b =>
        b.clientId === blockId ? { ...b, attributes: { ...b.attributes, content: newContent } } : b
      )
    );
  }, [setBlocks]);

  // Handle heading input changes with optimized cursor preservation
  const handleHeadingInput = useCallback((blockId: string, newContent: string, element: HTMLElement) => {
    // Prevent updates during React re-renders
    if (isUpdatingRef.current[blockId]) return;
    
    // Save cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPositionRef.current[blockId] = range.startOffset;
    }

    // Update blocks state
    setBlocks(prevBlocks =>
      prevBlocks.map(b =>
        b.clientId === blockId ? { ...b, attributes: { ...b.attributes, content: newContent } } : b
      )
    );
  }, [setBlocks]);

  // Restore cursor position after re-render
  const restoreCursorPosition = useCallback((blockId: string, element: HTMLElement) => {
    const savedPosition = cursorPositionRef.current[blockId];
    if (savedPosition !== undefined) {
      isUpdatingRef.current[blockId] = true;
      
      setTimeout(() => {
        try {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            const textNode = element.childNodes[0] || element;
            const maxPosition = textNode.textContent?.length || 0;
            const position = Math.min(savedPosition, maxPosition);
            
            range.setStart(textNode, position);
            range.setEnd(textNode, position);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (error) {
          console.error('Failed to restore cursor position:', error);
        } finally {
          isUpdatingRef.current[blockId] = false;
        }
      }, 0);
    }
  }, []);

  // Clean up cursor position tracking when blocks change
  useEffect(() => {
    const currentBlockIds = new Set(blocks.map(block => block.clientId));
    
    // Remove cursor positions for blocks that no longer exist
    Object.keys(cursorPositionRef.current).forEach(blockId => {
      if (!currentBlockIds.has(blockId)) {
        delete cursorPositionRef.current[blockId];
        delete isUpdatingRef.current[blockId];
      }
    });
  }, [blocks]);

  // Handle list input changes
  const handleListInput = useCallback((blockId: string, newContent: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(b => 
        b.clientId === blockId 
          ? { ...b, attributes: { ...b.attributes, values: newContent } }
          : b
      )
    );
  }, []);

  // Handle quote input changes
  const handleQuoteInput = useCallback((blockId: string, newContent: string) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(b => 
        b.clientId === blockId 
          ? { ...b, attributes: { ...b.attributes, value: newContent } }
          : b
      )
    );
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
                      <h1 
                        contentEditable
                        suppressContentEditableWarning
                        className="wp-block wp-block-post-title block-editor-block-list__block editor-post-title editor-post-title__input rich-text"
                        aria-label="Add title"
                        onInput={(e) => setTitle(e.currentTarget.textContent || '')}
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
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {title || 'Add title'}
                      </h1>
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
                                <div style={{ marginBottom: '4px' }}>
                                  {block.name === 'core/paragraph' && (
                                    <div
                                      key={`paragraph-${block.clientId}`}
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => {
                                        const newContent = e.currentTarget.textContent || '';
                                        handleParagraphInput(block.clientId, newContent, e.currentTarget);
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      ref={(el) => {
                                        if (el) {
                                          restoreCursorPosition(block.clientId, el);
                                        }
                                      }}
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
                                        margin: '0'
                                      }}
                                    >
                                      {block.attributes.content || 'Start writing...'}
                                    </div>
                                  )}

                                  {block.name === 'core/heading' && (
                                    <h2
                                      key={`heading-${block.clientId}`}
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => {
                                        const newContent = e.currentTarget.textContent || '';
                                        handleHeadingInput(block.clientId, newContent, e.currentTarget);
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      ref={(el) => {
                                        if (el) {
                                          restoreCursorPosition(block.clientId, el);
                                        }
                                      }}
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
                                    >
                                      {block.attributes.content || 'Heading'}
                                    </h2>
                                  )}

                                  {block.name === 'core/image' && (
                                    <figure style={{ textAlign: 'center', padding: '2px', border: '1px solid transparent', borderRadius: '2px', margin: '0' }}>
                                      {block.attributes.url ? (
                                        <img 
                                          src={block.attributes.url} 
                                          alt={block.attributes.alt || ''} 
                                          style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
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
                                      <figcaption 
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => {
                                          const newCaption = e.currentTarget.textContent || '';
                                          updateBlock(block.clientId, { caption: newCaption });
                                        }}
                                        onBlur={(e) => {
                                          const newCaption = e.currentTarget.textContent || '';
                                          updateBlock(block.clientId, { caption: newCaption });
                                        }}
                                        style={{ 
                                          fontSize: 'var(--wp--preset--font-size--x-small)',
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
                                          transition: 'border-color 0.2s ease'
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.style.borderColor = '#007cba';
                                          e.currentTarget.style.backgroundColor = '#f0f8ff';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.style.borderColor = 'transparent';
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        placeholder="Add caption..."
                                        data-placeholder="Add caption..."
                                      >
                                        {block.attributes.caption || ''}
                                      </figcaption>
                                    </figure>
                                  )}

                                  {block.name === 'core/list' && (
                                    <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => {
                                        const newContent = e.currentTarget.innerHTML;
                                        handleListInput(block.clientId, newContent);
                                      }}
                                      style={{
                                        outline: 'none',
                                        border: '1px solid transparent',
                                        background: 'transparent',
                                        width: '100%',
                                        fontSize: 'var(--wp--preset--font-size--medium)',
                                        lineHeight: '1.5',
                                        padding: '8px 8px 8px 1.5em',
                                        borderRadius: '4px'
                                      }}
                                      onFocus={(e) => {
                                        e.currentTarget.style.border = '1px solid #007cba';
                                      }}
                                      onBlur={(e) => {
                                        e.currentTarget.style.border = '1px solid transparent';
                                      }}
                                      dangerouslySetInnerHTML={{ __html: block.attributes.values || '<li>List item</li>' }}
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
                                      <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => {
                                          const newContent = e.currentTarget.innerHTML;
                                          handleQuoteInput(block.clientId, newContent);
                                        }}
                                        style={{
                                          outline: 'none',
                                          border: 'none',
                                          background: 'transparent',
                                          width: '100%',
                                          margin: '0'
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.parentElement!.style.border = '1px solid #007cba';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.parentElement!.style.border = '1px solid transparent';
                                        }}
                                        dangerouslySetInnerHTML={{ __html: block.attributes.value || '<p>Quote text</p>' }}
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
            width: '650px',
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
                placeholder="Search for a block or image..."
                value={inserterSearchQuery}
                onChange={(e) => {
                  const query = e.target.value;
                  setInserterSearchQuery(query);
                  if (query.trim()) {
                    handleInserterImageSearch(query);
                  } else {
                    setShowImageResults(false);
                  }
                }}
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '8px',
                    maxHeight: '300px',
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
                            height: '80px',
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
                <div className="block-editor-block-types-list">
                  {blockTypes.map((blockType) => (
                    <div
                      key={blockType.name}
                      className="block-editor-block-types-list__item"
                      onClick={() => handleInsertBlock(blockType.name, inserterPosition.index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        transition: 'all 0.2s ease'
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
                      <div style={{ 
                        fontSize: '20px', 
                        marginRight: '12px', 
                        width: '24px', 
                        textAlign: 'center' 
                      }}>
                        {blockType.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '14px', 
                          color: '#1e1e1e',
                          marginBottom: '2px'
                        }}>
                          {blockType.title}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#757575',
                          lineHeight: '1.4'
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
    </div>
  );
}

export default WordPressBlockEditor;
