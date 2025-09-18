'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClientOnlyGutenbergEditorProps, GutenbergBlock } from './types';
import { useWordPressComponents } from './hooks/useWordPressComponents';
import { useBlockManagement } from './hooks/useBlockManagement';
import { useImageSearch } from './hooks/useImageSearch';
import { convertHtmlToBlocks } from './utils/htmlParser';
import { getBlockEditorSettings } from './utils/blockEditorSettings';
import { BlockEdit } from './components/BlockEdit';
import { BlockInserter } from './components/BlockInserter';
// import { BlockInsertionPoint } from './components/BlockInsertionPoint';

// Import existing components
import ImageSearchModal from '../ImageSearchModal';
import CropModal from '../CropModal';
import ImageToolbar from '../ImageToolbar';

export default function ClientOnlyGutenbergEditor({ 
  post, 
  onSave, 
  onCancel 
}: ClientOnlyGutenbergEditorProps) {
  console.log('🚀 ClientOnlyGutenbergEditor rendered', { post: !!post, onSave: !!onSave, onCancel: !!onCancel });
  
  const [isClient, setIsClient] = useState(false);
  const [showBlockInserter, setShowBlockInserter] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [currentImageToCrop, setCurrentImageToCrop] = useState<any>(null);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [imageToolbarPosition, setImageToolbarPosition] = useState<{ 
    blockId: string; 
    x: number; 
    y: number; 
    popupX: number; 
    popupY: number 
  } | null>(null);

  // Calculate popup position based on click coordinates
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

  // Custom hooks
  const { components: WordPressComponents, isLoading: componentsLoading } = useWordPressComponents();
  const { 
    blocks, 
    setBlocks, 
    title, 
    setTitle, 
    handleBlocksChange, 
    handleSave, 
    addBlock 
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

  // Close block inserter and image toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle block inserter
      if (showBlockInserter && 
          !(event.target as Element).closest('.block-editor-inserter__popover') && 
          !(event.target as Element).closest('.block-editor-inserter__toggle')) {
        setShowBlockInserter(false);
      }

      // Handle image toolbar
      if (showImageToolbar && 
          !(event.target as Element).closest('.block-editor-block-popover') && 
          !(event.target as Element).matches('img')) {
        setShowImageToolbar(false);
        setImageToolbarPosition(null);
      }
    };

    if (showBlockInserter || showImageToolbar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBlockInserter, showImageToolbar]);

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
  }, [WordPressComponents, post, setBlocks, setTitle]);

  // Image handling functions
  const handleImageSelect = (image: any) => {
    setCurrentImageToCrop(image);
    setShowImageSearch(false);
    setShowCropModal(true);
  };

  const handleCropConfirm = async (croppedImageUrl: string) => {
    if (!currentImageToCrop || !currentBlockId) return;
    
    try {
      // Create caption with attribution for Unsplash and Pexels images
      let imageCaption = '';
      let imageAlt = currentImageToCrop.caption; // Use original caption for alt text
      
      if (currentImageToCrop.attribution && (currentImageToCrop.source === 'unsplash' || currentImageToCrop.source === 'pexels')) {
        imageCaption = currentImageToCrop.attribution; // Only show photographer attribution in caption
      }

      // OPTIMISTIC UI: Immediately show the cropped image using the blob URL
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.clientId === currentBlockId 
            ? { ...block, attributes: { ...block.attributes, url: croppedImageUrl, alt: imageAlt, caption: imageCaption } }
            : block
        )
      );
      
      // Close modal immediately - no waiting for upload
      setShowCropModal(false);
      setCurrentImageToCrop(null);
      setCurrentBlockId(null);

      // Upload in the background and update URL when ready
      const uploadInBackground = async () => {
        try {
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          
          let finalUrl = croppedImageUrl; // Keep blob URL as fallback
          
          // Try to upload to WordPress if available
          if (window.wordPressUpload) {
            try {
              const media = await window.wordPressUpload(file);
              finalUrl = media.source_url;
              console.log('✅ Background upload to WordPress completed:', finalUrl);
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
          
          // Update with final URL only if different from blob URL
          if (finalUrl !== croppedImageUrl) {
            setBlocks(prevBlocks => 
              prevBlocks.map(block => 
                block.clientId === currentBlockId && block.attributes.url === croppedImageUrl
                  ? { ...block, attributes: { ...block.attributes, url: finalUrl } }
                  : block
              )
            );
          }
        } catch (error) {
          console.error('Background upload error:', error);
          // Image will remain with blob URL, which still works for display
        }
      };

      // Start background upload without blocking UI
      uploadInBackground();
      
    } catch (error) {
      console.error('Error processing cropped image:', error);
    }
  };

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

  const blockEditorSettings = getBlockEditorSettings();

  return (
    <div className="official-gutenberg-editor">
      {/* WordPress-style Editor Container */}
      <div className="editor-styles-wrapper block-editor-writing-flow" style={{ minHeight: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Header with Title and Buttons */}
        <div className="editor-visual-editor__post-title-wrapper edit-post-visual-editor__post-title-wrapper has-global-padding" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '650px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="wp-block wp-block-post-title block-editor-block-list__block editor-post-title editor-post-title__input rich-text"
            aria-label="Add title"
            style={{ 
              fontSize: '2.5rem',
              fontWeight: 'bold',
              lineHeight: '1.2',
              margin: '0',
              padding: '0',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              textAlign: 'center',
              flex: '1',
              width: '100%'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
            <button
              onClick={() => setShowBlockInserter(!showBlockInserter)}
              className="components-button block-editor-inserter__toggle is-primary is-compact has-icon"
              aria-label="Block Inserter"
              style={{
                backgroundColor: '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                fontSize: '13px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#005a87';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007cba';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                <path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" fill="currentColor"></path>
              </svg>
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#00a32a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Save
            </button>
            <button
              onClick={onCancel}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Block Inserter - Only show when button is clicked */}
        {showBlockInserter && (
          <div style={{ position: 'relative', width: '100%', maxWidth: '650px', display: 'flex', justifyContent: 'center' }}>
            <BlockInserter
              isOpen={showBlockInserter}
              onClose={() => setShowBlockInserter(false)}
              onAddBlock={addBlock}
            />
          </div>
        )}

        {/* Editor Content */}
        <div className="editor-visual-editor__content" style={{ width: '100%', maxWidth: '650px', marginTop: '1rem' }}>
          {blocks.map((block, index) => (
            <div key={block.clientId}>
              {/* Insertion point before each block */}
              {/* Temporarily disabled to fix React error */}
              {/* <BlockInsertionPoint
                index={index}
                onInsertBlock={(blockType, attributes, blockIndex) => addBlock(blockType, attributes, blockIndex)}
                isVisible={true}
              /> */}
              
              <div style={{ marginBottom: '1rem' }}>
              <BlockEdit
                attributes={block.attributes}
                setAttributes={(newAttributes) => {
                  setBlocks(prevBlocks => 
                    prevBlocks.map(b => 
                      b.clientId === block.clientId 
                        ? { ...b, attributes: { ...b.attributes, ...newAttributes } }
                        : b
                    )
                  );
                }}
                blockName={block.name}
                clientId={block.clientId}
                onImageClick={(x, y) => {
                  console.log('🎯 Image click handler called in editor:', { x, y, blockId: block.clientId });
                  const { popupX, popupY } = calculateToolbarPosition();
                  console.log('📐 Calculated toolbar position:', { popupX, popupY });
                  setImageToolbarPosition({ 
                    blockId: block.clientId,
                    x,
                    y,
                    popupX,
                    popupY
                  });
                  setShowImageToolbar(true);
                  console.log('✅ Toolbar state updated, should be visible now');
                }}
                onDeleteBlock={(clientId) => {
                  console.log('🗑️ Deleting block:', clientId);
                  setBlocks(prevBlocks => prevBlocks.filter(b => b.clientId !== clientId));
                }}
              />
              </div>
            </div>
          ))}
          
          {/* Insertion point after the last block */}
          {/* Temporarily disabled to fix React error */}
          {/* <BlockInsertionPoint
            index={blocks.length}
            onInsertBlock={(blockType, attributes, blockIndex) => addBlock(blockType, attributes, blockIndex)}
            isVisible={true}
          /> */}
        </div>
      </div>

      {/* Image Toolbar */}
      {showImageToolbar && imageToolbarPosition && (
        <ImageToolbar
          position={imageToolbarPosition}
          isVisible={showImageToolbar}
        />
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
          setShowCropModal(false);
          setCurrentImageToCrop(null);
          setCurrentBlockId(null);
        }}
        onConfirm={handleCropConfirm}
        loading={false}
      />
    </div>
  );
}
