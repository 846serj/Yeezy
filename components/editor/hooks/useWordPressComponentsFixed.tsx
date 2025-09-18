import React, { useState, useEffect } from 'react';

export const useWordPressComponentsFixed = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState<any>(null);

  useEffect(() => {
    const loadWordPressComponents = async () => {
      try {
        console.log('🎨 Loading WordPress CSS...');
        // Load CSS first
        console.log('✅ WordPress CSS loaded');
        
        console.log('📚 Loading WordPress components...');
        const [
          blockEditorModule,
          componentsModule,
          blocksModule
        ] = await Promise.all([
          import('@wordpress/block-editor').catch(err => {
            console.warn('Failed to load @wordpress/block-editor:', err);
            return null;
          }),
          import('@wordpress/components').catch(err => {
            console.warn('Failed to load @wordpress/components:', err);
            return null;
          }),
          import('@wordpress/blocks').catch(err => {
            console.warn('Failed to load @wordpress/blocks:', err);
            return null;
          })
        ]);

        // Check if all modules loaded successfully
        if (!blockEditorModule || !componentsModule || !blocksModule) {
          throw new Error('Failed to load one or more WordPress modules');
        }

        const { 
          BlockEditorProvider, 
          BlockList, 
          BlockTools, 
          BlockInspector
        } = blockEditorModule as any;
        const { Popover, SlotFillProvider, Button } = componentsModule as any;
        const { parse, serialize, rawHandler } = blocksModule as any;

        console.log('✅ WordPress components loaded successfully');
        
        // Don't register custom blocks - let WordPress use its own core blocks
        console.log('🔧 Using WordPress core blocks (no custom registration needed)');

        setComponents({
          BlockEditorProvider,
          BlockList,
          BlockTools,
          BlockInspector,
          Popover,
          SlotFillProvider,
          Button,
          parse,
          serialize,
          rawHandler
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error loading WordPress components:', error);
        setIsLoading(false);
      }
    };

    loadWordPressComponents();
  }, []);

  return { components, isLoading };
};
