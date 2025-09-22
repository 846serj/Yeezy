'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ClientOnlyGutenbergEditorProps } from './types';
import { EDITOR_CONFIG } from './config';
import ClientOnlyGutenbergEditor, { ClientOnlyGutenbergEditorRef } from './ClientOnlyGutenbergEditor';
import WordPressBlockEditor, { WordPressBlockEditorRef } from './components/WordPressBlockEditor';

export interface SmartGutenbergEditorRef {
  handleSaveWithUploadCheck: () => Promise<void>;
  getUploadState: () => { hasUploadingImages: boolean; isSaving: boolean } | null;
}

const SmartGutenbergEditor = forwardRef<SmartGutenbergEditorRef, ClientOnlyGutenbergEditorProps>((props, ref) => {
  const [useWordPressOfficial, setUseWordPressOfficial] = useState<boolean>(EDITOR_CONFIG.USE_WORDPRESS_OFFICIAL);
  const [wordPressComponentsLoaded, setWordPressComponentsLoaded] = useState(false);
  const [fallbackToCustom, setFallbackToCustom] = useState(false);
  const [wordPressEditorRef, setWordPressEditorRef] = useState<WordPressBlockEditorRef | null>(null);
  const [clientOnlyEditorRef, setClientOnlyEditorRef] = useState<ClientOnlyGutenbergEditorRef | null>(null);

  // Expose the save function through ref
  useImperativeHandle(ref, () => ({
    handleSaveWithUploadCheck: async () => {
      if (wordPressEditorRef) {
        await wordPressEditorRef.handleSaveWithUploadCheck();
      } else if (clientOnlyEditorRef) {
        await clientOnlyEditorRef.handleSaveWithUploadCheck();
      } else {
        console.warn('⚠️ WordPress editor ref not available');
      }
    },
    getUploadState: () => {
      if (wordPressEditorRef) {
        return wordPressEditorRef.getUploadState();
      } else if (clientOnlyEditorRef) {
        return clientOnlyEditorRef.getUploadState();
      }
      return null;
    }
  }), [wordPressEditorRef, clientOnlyEditorRef]);

  useEffect(() => {
    // Test if WordPress components can be loaded
    const testWordPressComponents = async () => {
      try {
        
        const [blockEditor, components, blocks] = await Promise.all([
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
        
        if (blockEditor && components && blocks) {
          setWordPressComponentsLoaded(true);
          
        } else {
          throw new Error('One or more WordPress modules failed to load');
        }
      } catch (error) {
        console.warn('⚠️ WordPress components failed to load, falling back to custom implementation:', error);
        if (EDITOR_CONFIG.FALLBACK_TO_CUSTOM) {
          setFallbackToCustom(true);
          setUseWordPressOfficial(false);
        }
      }
    };

    if (EDITOR_CONFIG.USE_WORDPRESS_OFFICIAL) {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ WordPress components loading timeout, falling back to custom implementation');
        if (EDITOR_CONFIG.FALLBACK_TO_CUSTOM) {
          setFallbackToCustom(true);
          setUseWordPressOfficial(false);
        }
      }, 10000); // 10 second timeout

      testWordPressComponents().finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }, []);

  // Show loading state
  if (EDITOR_CONFIG.USE_WORDPRESS_OFFICIAL && !wordPressComponentsLoaded && !fallbackToCustom) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">
          Loading WordPress Editor...
        </span>
      </div>
    );
  }

  // Choose the appropriate editor
  if (useWordPressOfficial && wordPressComponentsLoaded) {
    
    return <WordPressBlockEditor ref={setWordPressEditorRef} {...props} />;
  } else {
    
    return <ClientOnlyGutenbergEditor ref={setClientOnlyEditorRef} {...props} />;
  }
});

export default SmartGutenbergEditor;
