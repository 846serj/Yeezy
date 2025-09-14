import { useState, useCallback, useRef, useEffect } from 'react';
import { GutenbergBlock, EditorContent } from '../types';
import { serializeBlocksToWordPress } from '../utils/blockSerializer';

export const useBlockManagement = (post: EditorContent | null, onSave: (post: EditorContent) => void) => {
  const [blocks, setBlocks] = useState<GutenbergBlock[]>([]);
  const [title, setTitle] = useState('');
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

        const updatedPost: EditorContent = {
          title: title, // Pass title as string for WordPress REST API
          content: serializedContent,
          excerpt: '', // Add empty excerpt for now
          status: 'draft' as 'publish' | 'draft' | 'private' | 'pending',
          featured_media: post?.featured_media || null,
          categories: post?.categories || [],
          tags: post?.tags || []
        };
        console.log('📝 Full post object being saved:', updatedPost);
        onSave(updatedPost);
      } catch (error) {
        console.error('Error serializing blocks:', error);
      }
    }
  }, [blocks, title, post, onSave]);

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
    handleBlocksChange,
    handleSave,
    addBlock,
    updateBlock,
    removeBlock,
    restoreBlocks
  };
};
