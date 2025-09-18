'use client';

import React, { useState, useEffect } from 'react';
import { ClientOnlyGutenbergEditorProps } from './types';
import { EDITOR_CONFIG } from './config';
import ClientOnlyGutenbergEditor from './ClientOnlyGutenbergEditor';
import WordPressBlockEditor from './components/WordPressBlockEditor';

export default function SmartGutenbergEditor(props: ClientOnlyGutenbergEditorProps) {
  const [useWordPressOfficial, setUseWordPressOfficial] = useState<boolean>(EDITOR_CONFIG.USE_WORDPRESS_OFFICIAL);
  const [wordPressComponentsLoaded, setWordPressComponentsLoaded] = useState(false);
  const [fallbackToCustom, setFallbackToCustom] = useState(false);

  useEffect(() => {
    // Test if WordPress components can be loaded
    const testWordPressComponents = async () => {
      try {
        console.log('🔍 Testing WordPress components availability...');
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
          console.log('✅ WordPress components loaded successfully');
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
    console.log('🎯 Using WordPress Official Block Editor');
    return <WordPressBlockEditor {...props} />;
  } else {
    console.log('🎯 Using Custom Block Editor');
    return <ClientOnlyGutenbergEditor {...props} />;
  }
}
