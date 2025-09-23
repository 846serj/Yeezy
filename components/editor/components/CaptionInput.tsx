'use client';

import React from 'react';
import { useContentEditable } from '../../../hooks/useContentEditable';

interface CaptionInputProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const CaptionInput: React.FC<CaptionInputProps> = ({
  content,
  onChange,
  placeholder = "Add caption..."
}) => {
  const { ref, onInput, onCompositionStart, onCompositionEnd, onKeyDown } = useContentEditable({
    value: content || '',
    onChange: onChange,
    richText: false, // Captions are plain text
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle Enter key to create line breaks
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '<br>');
        return;
      }
    }
  });

  return (
    <figcaption
      ref={ref}
      role="textbox"
      aria-multiline="true"
      className="block-editor-rich-text__editable wp-element-caption rich-text"
      aria-label="Image caption text"
      contentEditable={true}
      data-wp-block-attribute-key="caption"
      onInput={onInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#007cba';
        e.currentTarget.style.backgroundColor = '#f0f8ff';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={(e) => e.stopPropagation()}
      suppressContentEditableWarning={true}
      style={{
        whiteSpace: 'pre-wrap',
        minWidth: '1px',
        textAlign: 'center',
        color: 'var(--wp--preset--color--contrast)',
        fontSize: '0.55rem',
        marginTop: 'var(--wp--preset--spacing--30)',
        marginBottom: 'var(--wp--style--block-gap)',
        outline: 'none',
        border: '1px solid transparent',
        borderRadius: '2px',
        padding: '0px 0px',
        cursor: 'text',
        backgroundColor: 'transparent',
        transition: 'border-color 0.2s ease',
        width: '100%',
        overflowWrap: 'break-word',
        lineBreak: 'after-white-space' as any,
        WebkitNbspMode: 'space' as any,
        WebkitUserModify: 'read-write' as any
      } as React.CSSProperties}
    />
  );
};
