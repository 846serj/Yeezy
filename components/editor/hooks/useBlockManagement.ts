import { useState, useCallback, useRef, useEffect } from 'react';
import { GutenbergBlock, EditorContent } from '../types';
import { serializeBlocksToWordPress } from '../utils/blockSerializer';

export const useBlockManagement = (post: EditorContent | null, onSave: (post: EditorContent) => void) => {
  const [blocks, setBlocks] = useState<GutenbergBlock[]>([]);
  const [title, setTitle] = useState('');
  const [featuredImage, setFeaturedImage] = useState<{
    url: string;
    alt: string;
    caption: string;
    id?: number; // WordPress media ID
  } | null>(null);
  const blocksRef = useRef<GutenbergBlock[]>([]);

  // Keep blocks ref in sync with blocks state
  useEffect(() => {
    blocksRef.current = blocks;
    console.log('💾 Updated blocks ref with', blocks.length, 'blocks');
  }, [blocks]);

  const handleBlocksChange = useCallback((newBlocks: GutenbergBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  const handleSave = useCallback(async () => {
    if (onSave) {
      try {
        const serializedContent = serializeBlocksToWordPress(blocks);
        console.log('📝 Serialized content:', serializedContent);
        console.log('📝 Title being saved:', title);
        console.log('📝 Featured image being saved:', featuredImage);
        if (featuredImage?.caption) {
          console.log('📝 Featured image caption:', featuredImage.caption);
        }

        let featuredMediaId = post?.featured_media || null;

        // If we have a featured image, handle it appropriately
        if (featuredImage && featuredImage.url) {
          // If we already have a media ID, use it
          if (featuredImage.id) {
            featuredMediaId = featuredImage.id;
            console.log('📝 Using existing featured image media ID:', featuredMediaId);
          } else {
            // Check if this is a new image (not already uploaded to WordPress)
            const isNewImage = !featuredImage.url.includes('/wp-content/uploads/') && 
                              !featuredImage.url.includes('blob:') && 
                              !featuredImage.url.startsWith('data:');
            
            if (isNewImage) {
              try {
                console.log('📤 Uploading new featured image to WordPress...');
                
                // Convert the image URL to a file
                const response = await fetch(featuredImage.url);
                const blob = await response.blob();
                const file = new File([blob], 'featured-image.jpg', { type: 'image/jpeg' });
                
                // Upload to WordPress
                if (window.wordPressUpload) {
                  const media = await window.wordPressUpload(file);
                  featuredMediaId = media.id;
                  console.log('✅ Featured image uploaded to WordPress with ID:', featuredMediaId);
                  
                  // Update the featured image state with the media ID
                  setFeaturedImage(prev => prev ? { ...prev, id: media.id } : null);
                } else {
                  console.warn('⚠️ WordPress upload not available, keeping original featured_media');
                }
              } catch (error) {
                console.error('❌ Error uploading featured image:', error);
                // Keep the original featured_media if upload fails
              }
            } else {
              console.log('📝 Featured image is already uploaded to WordPress, but no media ID available');
              // If it's already a WordPress URL but we don't have the ID, keep the original
              console.log('⚠️ Cannot determine media ID for existing WordPress image');
            }
          }
        } else {
          console.log('📝 No featured image to save');
        }

        const updatedPost: EditorContent = {
          title: title, // Pass title as string for WordPress REST API
          content: serializedContent,
          excerpt: '', // Add empty excerpt for now
          status: 'draft' as 'publish' | 'draft' | 'private' | 'pending',
          featured_media: featuredMediaId, // Use the uploaded media ID
          categories: post?.categories || [],
          tags: post?.tags || []
        };
        console.log('📝 Full post object being saved:', updatedPost);
        console.log('🖼️ Featured media ID being sent to WordPress:', featuredMediaId);
        onSave(updatedPost);
      } catch (error) {
        console.error('Error serializing blocks:', error);
      }
    }
  }, [blocks, title, featuredImage, post, onSave]);

  const addBlock = (blockType: string, attributes: Record<string, any> = {}, index?: number) => {
    const newBlock: GutenbergBlock = {
      name: blockType,
      attributes: {
        content: '',
        ...attributes
      },
      clientId: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isValid: true,
      innerBlocks: []
    };

    if (typeof index === 'number') {
      setBlocks(prevBlocks => {
        const newBlocks = [...prevBlocks];
        newBlocks.splice(index, 0, newBlock);
        return newBlocks;
      });
    } else {
      setBlocks(prevBlocks => [...prevBlocks, newBlock]);
    }
  };

  const updateBlock = (clientId: string, attributes: Record<string, any>) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.clientId === clientId 
          ? { ...block, attributes: { ...block.attributes, ...attributes } }
          : block
      )
    );
  };

  const removeBlock = (clientId: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.clientId !== clientId));
  };

  const restoreBlocks = useCallback(() => {
    if (blocksRef.current.length > 0) {
      console.log('🔄 Restoring blocks from ref:', blocksRef.current.length, 'blocks');
      setBlocks(blocksRef.current);
      return true;
    }
    return false;
  }, []);

  return {
    blocks,
    setBlocks,
    title,
    setTitle,
    featuredImage,
    setFeaturedImage,
    handleBlocksChange,
    handleSave,
    addBlock,
    updateBlock,
    removeBlock,
    restoreBlocks
  };
};
