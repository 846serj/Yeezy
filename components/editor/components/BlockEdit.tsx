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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      
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
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent' }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setAttributes({ content: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', 
              minHeight: '32px',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: '19px',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
              outline: 'none'
            }}
            placeholder="Enter paragraph text..."
          />
        </div>
      );
      
    case 'core/heading':
      const HeadingTag = `h${level}`;
      return (
        <div style={{ margin: '1em 0', padding: '0', border: 'none', backgroundColor: 'transparent' }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setAttributes({ content: e.target.value });
              handleAutoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            style={{ 
              width: '100%', 
              minHeight: '28px',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '2px 0',
              fontFamily: 'inherit',
              fontSize: level === 1 ? '2.5rem' : level === 2 ? '2rem' : level === 3 ? '1.75rem' : level === 4 ? '1.5rem' : level === 5 ? '1.25rem' : '1rem',
              fontWeight: 'bold',
              lineHeight: '1.2',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
              outline: 'none'
            }}
            placeholder={`Enter heading ${level} text...`}
          />
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
                  console.log('🖼️ Image clicked!', { onImageClick: !!onImageClick });
                  if (onImageClick) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = rect.left + (rect.width / 2);
                    const clickY = rect.top;
                    console.log('📍 Image click coordinates:', { clickX, clickY });
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
                  fontSize: '14px', 
                  color: '#666', 
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  {caption}
                </figcaption>
              )}
            </figure>
          ) : (
            <div style={{ 
              border: '2px dashed #ccc', 
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px'
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
              minHeight: '32px',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: '19px',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
              outline: 'none'
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
              minHeight: '32px',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: '19px',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
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
              minHeight: '32px',
              height: 'auto',
              border: 'none', 
              borderRadius: '0', 
              padding: '0',
              fontFamily: 'inherit',
              fontSize: '19px',
              lineHeight: '1.5',
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              whiteSpace: 'pre-wrap',
              minWidth: '1px',
              outline: 'none'
            }}
            placeholder="Enter text..."
          />
        </div>
      );
  }
};
