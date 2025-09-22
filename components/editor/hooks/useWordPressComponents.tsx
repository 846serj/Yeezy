import React, { useState, useEffect } from 'react';

export const useWordPressComponents = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState<any>(null);

  useEffect(() => {
    const loadWordPressComponents = async () => {
      try {
        
        // Load CSS first
        
        
        
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
          // Temporarily disabled to fix React error
          // BlockInserter,
          // Inserter,
          // BlockAppender
        } = blockEditorModule as any;
        const { Popover, SlotFillProvider, Button } = componentsModule as any;
        const { parse, serialize, rawHandler, registerBlockType } = blocksModule as any;

        
        
        // Register core blocks with proper edit/save functions
        
        
        // Register paragraph block
        registerBlockType('core/paragraph', {
          title: 'Paragraph',
          description: 'Start with the building block of all narrative.',
          icon: 'editor-paragraph',
          category: 'text',
          supports: {
            html: false,
          },
          attributes: {
            content: {
              type: 'string',
              source: 'html',
              selector: 'p',
              default: '',
            },
            dropCap: {
              type: 'boolean',
              default: false,
            },
          },
          edit: ({ attributes, setAttributes }: { attributes: any; setAttributes: (attrs: any) => void }) => {
            return (
              <p
                contentEditable
                suppressContentEditableWarning
                onInput={(e: any) => setAttributes({ content: e.currentTarget.textContent || '' })}
                onKeyDown={(e: any) => {
                  // Prevent cursor jumping by handling key events properly
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '<br>');
                  }
                }}
                style={{ 
                  minHeight: '1.5em',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: 'var(--wp--preset--font-size--medium)',
                  lineHeight: '1.5',
                  direction: 'ltr',
                  unicodeBidi: 'normal'
                }}
              >
                {attributes.content || 'Start writing...'}
              </p>
            );
          },
          save: ({ attributes }: { attributes: any }) => {
            return React.createElement('p', null, attributes.content);
          },
        });

        // Register heading block
        registerBlockType('core/heading', {
          title: 'Heading',
          description: 'Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.',
          icon: 'heading',
          category: 'text',
          supports: {
            html: false,
          },
          attributes: {
            content: {
              type: 'string',
              source: 'html',
              selector: 'h1,h2,h3,h4,h5,h6',
              default: '',
            },
            level: {
              type: 'number',
              default: 2,
            },
          },
          edit: ({ attributes, setAttributes }: { attributes: any; setAttributes: (attrs: any) => void }) => {
            const tagName = `h${attributes.level || 2}`;
            const HeadingTag = tagName as keyof JSX.IntrinsicElements;
            return (
              <HeadingTag
                contentEditable
                suppressContentEditableWarning
                onInput={(e: any) => setAttributes({ content: e.currentTarget.textContent || '' })}
                onKeyDown={(e: any) => {
                  // Prevent cursor jumping by handling key events properly
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '<br>');
                  }
                }}
                style={{ 
                  minHeight: '1.2em',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: `var(--wp--preset--font-size--${attributes.level === 1 ? 'x-large' : attributes.level === 2 ? 'large' : 'medium'})`,
                  fontWeight: '800',
                  lineHeight: '1.2',
                  margin: '0',
                  direction: 'ltr',
                  unicodeBidi: 'normal'
                }}
              >
                {attributes.content || 'Heading'}
              </HeadingTag>
            );
          },
          save: ({ attributes }: { attributes: any }) => {
            const tagName = `h${attributes.level || 2}`;
            return React.createElement(tagName, null, attributes.content);
          },
        });

        // Register image block
        registerBlockType('core/image', {
          title: 'Image',
          description: 'Insert an image to make a visual statement.',
          icon: 'format-image',
          category: 'media',
          supports: {
            html: false,
          },
          attributes: {
            url: {
              type: 'string',
              source: 'attribute',
              selector: 'img',
              attribute: 'src',
            },
            alt: {
              type: 'string',
              source: 'attribute',
              selector: 'img',
              attribute: 'alt',
            },
            caption: {
              type: 'string',
              source: 'html',
              selector: 'figcaption',
            },
          },
          edit: ({ attributes, setAttributes }: { attributes: any; setAttributes: (attrs: any) => void }) => {
            return (
              <figure style={{ margin: 'var(--wp--style--block-gap) 0', textAlign: 'center' }}>
                {attributes.url ? (
                  <img
                    src={attributes.url}
                    alt={attributes.alt || ''}
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      display: 'block',
                      margin: '0 auto'
                    }}
                  />
                ) : (
                  <div style={{ 
                    border: 'var(--space-2) dashed #ccc', 
                    padding: 'var(--space-40)', 
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9',
                    color: '#666'
                  }}>
                    No image selected
                  </div>
                )}
                {attributes.caption && (
                  <figcaption
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e: any) => setAttributes({ caption: e.currentTarget.textContent || '' })}
                    style={{ 
                      fontSize: 'var(--wp--preset--font-size--x-small)',
                      color: 'var(--wp--preset--color--contrast)',
                      marginTop: 'var(--wp--preset--spacing--30)',
                      textAlign: 'center',
                      outline: 'none',
                      border: 'none',
                      background: 'transparent',
                      width: '100%'
                    }}
                  >
                    {attributes.caption}
                  </figcaption>
                )}
              </figure>
            );
          },
          save: ({ attributes }: { attributes: any }) => {
            const captionElement = attributes.caption 
              ? React.createElement('figcaption', null, attributes.caption)
              : null;
            
            return React.createElement('figure', null, 
              React.createElement('img', { src: attributes.url, alt: attributes.alt || '' }),
              captionElement
            );
          },
        });

        // Register list block
        registerBlockType('core/list', {
          title: 'List',
          description: 'Create a bulleted or numbered list.',
          icon: 'editor-ul',
          category: 'text',
          supports: {
            html: false,
          },
          attributes: {
            values: {
              type: 'string',
              source: 'html',
              selector: 'ul,ol',
              multiline: 'li',
            },
            ordered: {
              type: 'boolean',
              default: false,
            },
          },
          edit: ({ attributes, setAttributes }: { attributes: any; setAttributes: (attrs: any) => void }) => {
            const tagName = attributes.ordered ? 'ol' : 'ul';
            const ListTag = tagName as keyof JSX.IntrinsicElements;
            return (
              <ListTag
                contentEditable
                suppressContentEditableWarning
                onInput={(e: any) => setAttributes({ values: e.currentTarget.innerHTML })}
                style={{ 
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: 'var(--wp--preset--font-size--medium)',
                  lineHeight: '1.5',
                  paddingLeft: '1.5em'
                }}
                dangerouslySetInnerHTML={{ __html: attributes.values || '<li>List item</li>' }}
              />
            );
          },
          save: ({ attributes }: { attributes: any }) => {
            const tagName = attributes.ordered ? 'ol' : 'ul';
            return React.createElement(tagName, {
              dangerouslySetInnerHTML: { __html: attributes.values }
            });
          },
        });

        // Register quote block
        registerBlockType('core/quote', {
          title: 'Quote',
          description: 'Give quoted text visual emphasis. "In quoting others, we cite ourselves." —Alejandro Jodorowsky',
          icon: 'format-quote',
          category: 'text',
          supports: {
            html: false,
          },
          attributes: {
            value: {
              type: 'string',
              source: 'html',
              selector: 'blockquote',
              multiline: 'p',
            },
            citation: {
              type: 'string',
              source: 'html',
              selector: 'cite',
            },
          },
          edit: ({ attributes, setAttributes }: { attributes: any; setAttributes: (attrs: any) => void }) => {
            return (
              <blockquote style={{ 
                borderLeft: 'var(--space-4) solid var(--wp--preset--color--primary)',
                paddingLeft: 'var(--wp--preset--spacing--40)',
                margin: 'var(--wp--style--block-gap) 0',
                fontStyle: 'italic',
                fontSize: 'var(--wp--preset--font-size--medium)',
                lineHeight: '1.6'
              }}>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e: any) => setAttributes({ value: e.currentTarget.innerHTML })}
                  style={{ 
                    outline: 'none',
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    margin: '0'
                  }}
                  dangerouslySetInnerHTML={{ __html: attributes.value || '<p>Quote text</p>' }}
                />
                {attributes.citation && (
                  <cite
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e: any) => setAttributes({ citation: e.currentTarget.textContent || '' })}
                    style={{ 
                      display: 'block',
                      marginTop: 'var(--wp--preset--spacing--30)',
                      fontSize: 'var(--wp--preset--font-size--small)',
                      fontStyle: 'normal',
                      outline: 'none',
                      border: 'none',
                      background: 'transparent',
                      width: '100%'
                    }}
                  >
                    — {attributes.citation}
                  </cite>
                )}
              </blockquote>
            );
          },
          save: ({ attributes }: { attributes: any }) => {
            const citationElement = attributes.citation 
              ? React.createElement('cite', null, '— ', attributes.citation)
              : null;
            
            return React.createElement('blockquote', null,
              React.createElement('div', {
                dangerouslySetInnerHTML: { __html: attributes.value }
              }),
              citationElement
            );
          },
        });

        // Register separator block
        registerBlockType('core/separator', {
          title: 'Separator',
          description: 'Create a break between ideas or sections.',
          icon: 'minus',
          category: 'design',
          supports: {
            html: false,
          },
          attributes: {},
          edit: () => {
            return (
              <hr style={{ 
                border: 'none',
                borderTop: 'var(--space-1) solid #ddd',
                margin: '2em 0',
                height: 'var(--space-1)'
              }} />
            );
          },
          save: () => {
            return <hr />;
          },
        });

        

        setComponents({
          BlockEditorProvider,
          BlockList,
          BlockTools,
          BlockInspector,
          // Temporarily disabled to fix React error
          // BlockInserter,
          // Inserter,
          // BlockAppender,
          Popover,
          SlotFillProvider,
          Button,
          parse,
          serialize,
          rawHandler,
          registerBlockType
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
