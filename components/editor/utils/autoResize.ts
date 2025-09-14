export const autoResize = (textarea: HTMLTextAreaElement, blockName: string) => {
  if (!textarea) return;
  
  const minHeight = blockName === 'core/paragraph' ? 32 : 28;
  
  // Store current scroll position
  const scrollTop = textarea.scrollTop;
  
  // Reset height to auto to get accurate scrollHeight
  textarea.style.height = 'auto';
  
  // Force a reflow to ensure accurate measurements
  textarea.offsetHeight;
  
  // Get the scroll height (this accounts for text wrapping)
  const scrollHeight = textarea.scrollHeight;
  
  // Calculate line height based on font size
  const fontSize = parseInt(getComputedStyle(textarea).fontSize) || 19;
  const lineHeight = fontSize * 1.5; // 1.5 line height
  
  // For empty content, use min height
  if (textarea.value.trim() === '') {
    textarea.style.height = minHeight + 'px';
  } else {
    // Use scrollHeight but ensure it's reasonable
    // Add a small buffer (4px) to prevent cutting off text
    const calculatedHeight = Math.max(minHeight, scrollHeight + 4);
    
    // Set a reasonable maximum height (e.g., 10 lines)
    const maxHeight = lineHeight * 10;
    const finalHeight = Math.min(calculatedHeight, maxHeight);
    
    textarea.style.height = finalHeight + 'px';
  }
  
  // Restore scroll position
  textarea.scrollTop = scrollTop;
};
