import { useRef, useCallback, useEffect } from 'react';

interface UseContentEditableProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  richText?: boolean; // New prop to enable HTML content
}

export const useContentEditable = ({ value, onChange, onKeyDown, richText = false }: UseContentEditableProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    try {
      if (isComposingRef.current) return;
      
      const content = richText ? (e.currentTarget.innerHTML || '') : (e.currentTarget.textContent || '');
      if (content !== value) {
        onChange(content);
      }
    } catch (error) {
      console.warn('ContentEditable input error:', error);
    }
  }, [value, onChange, richText]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLDivElement>) => {
    try {
      isComposingRef.current = false;
      const content = richText ? (e.currentTarget.innerHTML || '') : (e.currentTarget.textContent || '');
      if (content !== value) {
        onChange(content);
      }
    } catch (error) {
      console.warn('ContentEditable composition error:', error);
    }
  }, [value, onChange, richText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [onKeyDown]);

  // Update content when value changes externally (but not during user input)
  useEffect(() => {
    const currentContent = richText ? (ref.current?.innerHTML || '') : (ref.current?.textContent || '');
    if (ref.current && currentContent !== value) {
      const selection = window.getSelection();
      let range: Range | null = null;
      let isCursorAtEnd = false;
      
      // Safely get the current range
      try {
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
          const textLength = ref.current.textContent?.length || 0;
          isCursorAtEnd = range && range.endOffset === textLength;
        }
      } catch (error) {
        // Ignore selection errors
        console.warn('Selection error:', error);
      }
      
      if (richText) {
        ref.current.innerHTML = value;
      } else {
        ref.current.textContent = value;
      }
      
      // Restore cursor position safely
      if (selection && range && ref.current.textContent) {
        try {
          const newRange = document.createRange();
          const textLength = ref.current.textContent.length;
          
          if (isCursorAtEnd) {
            newRange.selectNodeContents(ref.current);
            newRange.collapse(false);
          } else {
            const startOffset = Math.min(Math.max(0, range.startOffset), textLength);
            const textNode = ref.current.firstChild;
            
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              newRange.setStart(textNode, startOffset);
            } else {
              newRange.setStart(ref.current, Math.min(startOffset, ref.current.childNodes.length));
            }
            newRange.collapse(true);
          }
          
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (error) {
          // Ignore range errors
          console.warn('Range error:', error);
        }
      }
    }
  }, [value, richText]);

  return {
    ref,
    onInput: handleInput,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  };
};
