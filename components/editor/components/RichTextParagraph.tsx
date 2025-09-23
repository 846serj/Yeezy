'use client';

import React from 'react';
import { useContentEditable } from '../../../hooks/useContentEditable';

interface RichTextParagraphProps {
  content: string;
  onChange: (content: string) => void;
  onDelete: () => void;
  placeholder?: string;
  clientId?: string;
}

export const RichTextParagraph: React.FC<RichTextParagraphProps> = ({
  content,
  onChange,
  onDelete,
  placeholder = "Start writing...",
  clientId = `block-${Date.now()}`
}) => {
  // Use the same useContentEditable hook that headers use, but with richText enabled
  const { ref, onInput, onCompositionStart, onCompositionEnd, onKeyDown } = useContentEditable({
    value: content || '',
    onChange: onChange,
    richText: true, // Enable HTML content support
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      try {
        // Handle backspace when content is empty (check textContent like headers do)
        if (e.key === 'Backspace' && e.currentTarget.textContent === '') {
          e.preventDefault();
          onDelete();
          return;
        }

        // Handle Enter key to create line breaks
        if (e.key === 'Enter') {
          e.preventDefault();
          document.execCommand('insertHTML', false, '<br>');
          return;
        }

        // Handle Ctrl+K or Cmd+K for link creation
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const url = prompt('Enter URL:');
          if (url) {
            const selection = window.getSelection();
            const text = selection?.toString() || url;
            const linkHtml = `<a href="${url}" data-type="link" data-id="${url}" data-rich-text-format-boundary="true" target="_blank" rel="noopener noreferrer">${text}</a>`;
            document.execCommand('insertHTML', false, linkHtml);
          }
          return;
        }
      } catch (error) {
        console.warn('ContentEditable keydown error:', error);
      }
    }
  });

  return (
    <div
      ref={ref}
      role="document"
      aria-multiline="true"
      className="block-editor-rich-text__editable block-editor-block-list__block wp-block is-selected wp-block-paragraph rich-text"
      id={clientId}
      aria-label="Block: Paragraph"
      data-block={clientId}
      data-type="core/paragraph"
      data-title="Paragraph"
      data-empty={!content || content.trim() === '' ? 'true' : 'false'}
      contentEditable={true}
      data-wp-block-attribute-key="content"
      suppressContentEditableWarning={true}
      onInput={onInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
      style={{
        whiteSpace: 'pre-wrap',
        minWidth: '1px',
        margin: '1em 0',
        fontSize: '13px',
        lineHeight: '1.5',
        overflowWrap: 'break-word',
        pointerEvents: 'auto',
        position: 'relative'
      }}
    />
  );
};
