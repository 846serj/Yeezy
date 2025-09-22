import React, { useRef, useEffect, useState } from 'react';
import { autoResize } from '../utils/autoResize';
import ImageToolbar from '../../ImageToolbar';

interface BlockEditProps {
  attributes: Record<string, any>;
  setAttributes: (attributes: Record<string, any>) => void;
  blockName: string;
  clientId: string;
  onImageClick?: (x: number, y: number) => void;
  onDeleteBlock?: (clientId: string) => void;
}

export const BlockEdit: React.FC<BlockEditProps> = ({ 
  attributes, 
  setAttributes, 
  blockName, 
  clientId,
  onImageClick,
  onDeleteBlock
}) => {
  const { content, level, url, alt, caption, values, ordered, value, citation } = attributes;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize function - Handles text wrapping properly
  const handleAutoResize = (textarea: HTMLTextAreaElement) => {
    autoResize(textarea, blockName);
  };

  // Handle backspace deletion when cursor is at the beginning
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      let cursorPosition = 0;
      
      if (e.currentTarget instanceof HTMLTextAreaElement) {
        cursorPosition = e.currentTarget.selectionStart || 0;
      } else {
        const selection = window.getSelection();
        cursorPosition = selection?.anchorOffset || 0;
      }
      
      // Check if cursor is at the beginning and content is empty or only whitespace
      if (cursorPosition === 0 && (!content || content.trim() === '')) {
        e.preventDefault();
        if (onDeleteBlock) {
          onDeleteBlock(clientId);
        }
      }
    }
  };
  
  // Set initial height on mount and when content changes
  useEffect(() => {
    if (textareaRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        handleAutoResize(textareaRef.current!);
      }, 0);
    }
  }, [content]);
  
  // Also trigger resize when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      handleAutoResize(textareaRef.current);
    }
  }, []);
  
  // Force resize on every render to ensure accuracy
  useEffect(() => {
    if (textareaRef.current) {
      const timer = setTimeout(() => {
        handleAutoResize(textareaRef.current!);
      }, 10);
      return () => clearTimeout(timer);
    }
  });
  
  switch (blockName) {
    case 'core/paragraph':
      return (
        <div className="block-container">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setAttributes({ content: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            className="paragraph-input"
            placeholder="Enter paragraph text..."
          />
        </div>
      );
      
    case 'core/heading':
      const HeadingTag = `h${level}`;
      return (
        <div className="block-container">
          <div
            role="document"
            aria-multiline="true"
            className={`block-editor-rich-text__editable block-editor-block-list__block wp-block is-selected wp-block-heading rich-text heading-input heading-input--h${level}`}
            id={`block-${clientId}`}
            aria-label="Block: Heading"
            data-block={clientId}
            data-type="core/heading"
            data-title="Heading"
            contentEditable={true}
            data-wp-block-attribute-key="content"
            style={{
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
              overflowWrap: 'break-word',
              lineBreak: 'after-white-space' as any,
              WebkitNbspMode: 'space' as any,
              WebkitUserModify: 'read-write' as any
            } as React.CSSProperties}
            onInput={(e) => {
              const content = e.currentTarget.textContent || '';
              setAttributes({ content });
            }}
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning={true}
          >
            {content}
          </div>
        </div>
      );
      
    case 'core/image':
      return (
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent', position: 'relative' }}>
          {url ? (
            <figure style={{ margin: '0', textAlign: 'center' }}>
              <img 
                src={url} 
                alt={alt || ''} 
                onClick={(e) => {
                  
                  if (onImageClick) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = rect.left + (rect.width / 2);
                    const clickY = rect.top;
                    
                    onImageClick(clickX, clickY);
                  }
                }}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  display: 'block',
                  margin: '0 auto',
                  cursor: 'pointer'
                }} 
              />
              {caption && (
                <figcaption style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  color: '#666', 
                  marginTop: 'var(--space-8)',
                  fontStyle: 'italic'
                }}>
                  {caption}
                </figcaption>
              )}
            </figure>
          ) : (
            <div style={{ 
              border: 'var(--space-2) dashed #ccc', 
              padding: 'var(--space-20)', 
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: 'var(--space-4)'
            }}>
              <p style={{ margin: '0', color: '#666' }}>No image selected</p>
            </div>
          )}
        </div>
      );
      
    case 'core/list':
      return (
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent' }}>
          <textarea
            ref={textareaRef}
            value={values || ''}
            onChange={(e) => {
              setAttributes({ values: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', 
              minHeight: 'var(--space-32)',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-base)',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: 'var(--space-1)',
              outline: 'none',
              direction: 'ltr',
              unicodeBidi: 'normal'
            }}
            placeholder="Enter list items (one per line)..."
          />
        </div>
      );
      
    case 'core/quote':
      return (
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent' }}>
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => {
              setAttributes({ value: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', 
              minHeight: 'var(--space-32)',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-base)',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: 'var(--space-1)',
              outline: 'none',
              fontStyle: 'italic'
            }}
            placeholder="Enter quote text..."
          />
        </div>
      );
      
    default:
      return (
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent' }}>
          <textarea
            ref={textareaRef}
            value={content || ''}
            onChange={(e) => {
              setAttributes({ content: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', 
              minHeight: 'var(--space-32)',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: 'var(--font-size-base)',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: 'var(--space-1)',
              outline: 'none',
              direction: 'ltr',
              unicodeBidi: 'normal'
            }}
            placeholder="Enter text..."
          />
        </div>
      );
  }
};
