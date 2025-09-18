'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClientOnlyGutenbergEditorProps } from '../types';
import { useWordPressComponentsFixed } from '../hooks/useWordPressComponentsFixed';
import { convertHtmlToBlocks } from '../utils/htmlParser';
import { GutenbergBlock } from '../types';

export default function WordPressBlockEditorFixed({ 
  post, 
  onSave, 
  onCancel 
}: ClientOnlyGutenbergEditorProps) {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<GutenbergBlock[]>([]);
  const [featuredImage, setFeaturedImage] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { components: WordPressComponents, isLoading: componentsLoading } = useWordPressComponentsFixed();

  // Destructure WordPress components
  const {
    BlockEditorProvider,
    BlockList,
    SlotFillProvider,
    Button
  } = WordPressComponents || {};

  // Initialize editor with post data
  useEffect(() => {
    if (!WordPressComponents || !post) {
      return;
    }

    const initializeEditor = async () => {
      console.log('📝 Initializing editor with post data');
      setTitle(post.title || '');
      
      // Handle featured image
      if (post.featured_media && post._embedded?.['wp:featuredmedia']?.[0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        setFeaturedImage({
          id: media.id,
          url: media.media_details?.sizes?.full?.source_url || media.source_url,
          alt: media.alt_text || '',
          caption: media.caption?.rendered || ''
        });
      }
      
      if (post.content) {
        try {
          console.log('🔍 Parsing post content...');
          const parsedBlocks = WordPressComponents.parse(post.content);
          console.log('✅ Parsed blocks:', parsedBlocks.length);
          
          if (parsedBlocks.length === 0) {
            console.log('⚠️ No blocks parsed - content might be in HTML format, manually converting HTML to blocks');
            const manualBlocks = convertHtmlToBlocks(post.content);
            console.log('🔧 Manually converted blocks:', manualBlocks.length);
            setBlocks(manualBlocks);
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
    };

    initializeEditor();
  }, [WordPressComponents, post]);

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
  const handleBlocksChange = useCallback((newBlocks: any[]) => {
    console.log('🔄 Blocks changed:', newBlocks.length);
    // Convert WordPress blocks back to our format
    const convertedBlocks = newBlocks.map(block => ({
      clientId: block.clientId,
      name: block.name,
      isValid: block.isValid,
      attributes: block.attributes,
      innerBlocks: block.innerBlocks || []
    }));
    setBlocks(convertedBlocks);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!WordPressComponents || !onSave) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving post...');
      
      // Serialize blocks to WordPress format
      const serializedContent = WordPressComponents.serialize(wordPressBlocks);
      console.log('📝 Serialized content:', serializedContent);
      
      const postData = {
        title: title,
        content: serializedContent,
        excerpt: '',
        status: 'draft' as const,
        featured_media: featuredImage?.id || null,
        categories: post?.categories || [],
        tags: post?.tags || []
      };
      
      console.log('📝 Full post object being saved:', postData);
      await onSave(postData);
      console.log('✅ Save completed successfully');
    } catch (error) {
      console.error('❌ Error saving post:', error);
    } finally {
      setIsSaving(false);
    }
  }, [WordPressComponents, onSave, title, wordPressBlocks, featuredImage, post]);

  // Block editor settings
  const blockEditorSettings = useMemo(() => ({
    hasFixedToolbar: true,
    focusMode: false,
    hasReducedUI: false,
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
  }), []);

  // Show loading while checking client side or loading WordPress components
  if (typeof window === 'undefined' || componentsLoading || !WordPressComponents) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>Loading WordPress Editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <main className="main-content">
        <div className="container">
          {/* WordPress-style Header */}
          <div className="edit-post-header">
            <div className="edit-post-header__toolbar">
              <div className="edit-post-header__toolbar-group">
                <Button
                  variant="tertiary"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
              <div className="edit-post-header__toolbar-group">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
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
                      {featuredImage && (
                        <div 
                          className="editor-visual-editor__featured-image-wrapper"
                          style={{
                            maxWidth: '650px',
                            margin: '20px auto 0 auto',
                            padding: '0 20px'
                          }}
                        >
                          <div className="wp-block-image">
                            <figure style={{
                              textAlign: 'center',
                              padding: '0',
                              border: '1px solid transparent',
                              borderRadius: '4px',
                              margin: '0',
                              cursor: 'pointer',
                              transition: 'border-color 0.2s ease'
                            }}>
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
                            </figure>
                          </div>
                        </div>
                      )}

                      {/* Block Editor Content */}
                      <div 
                        className="is-root-container is-desktop-preview is-layout-constrained wp-block-post-content-is-layout-constrained has-global-padding wp-block-post-content has-global-padding block-editor-block-list__layout"
                        style={{
                          maxWidth: '654px',
                          margin: '0 auto',
                          padding: '0 20px'
                        }}
                      >
                        {/* Use WordPress BlockList component */}
                        <BlockList />
                      </div>
                    </div>
                  </div>
                </BlockEditorProvider>
              </SlotFillProvider>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
