export const autoResize = (textarea: HTMLTextAreaElement, blockName: string) => {
  if (!textarea || !textarea.style) return;
  
  // Calculate min height based on line height for better responsiveness
  const fontSize = parseInt(getComputedStyle(textarea).fontSize) || 19;
  const lineHeight = fontSize * 1.2; // Use 1.2 line height for better text wrapping
  const minHeight = blockName === 'core/paragraph' ? Math.max(32, lineHeight) : Math.max(28, lineHeight);
  
  // Store current scroll position
  const scrollTop = textarea.scrollTop;
  
  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto';
  
  // Force a reflow to ensure accurate measurements
  textarea.offsetHeight;
  
  // Get the scroll height (this accounts for text wrapping)
  const scrollHeight = textarea.scrollHeight;
  
  // For empty content, use min height
  if (textarea.value.trim() === '') {
    textarea.style.height = minHeight + 'px';
  } else {
    // Use scrollHeight but ensure it's reasonable
    // Add a small buffer (var(--space-4)) to prevent cutting off text
    const calculatedHeight = Math.max(minHeight, scrollHeight + 4);
    
    // Set a more generous maximum height (e.g., 15 lines for headings, 20 for paragraphs)
    const maxLines = blockName === 'core/heading' ? 15 : 20;
    const maxHeight = lineHeight * maxLines;
    const finalHeight = Math.min(calculatedHeight, maxHeight);
    
    textarea.style.height = finalHeight + 'px';
  }
  
  // Restore scroll position
  textarea.scrollTop = scrollTop;
};
