import { GutenbergBlock } from '../types';

export const convertHtmlToBlocks = (html: string): GutenbergBlock[] => {
  const blocks: GutenbergBlock[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Helper function to process HTML content and preserve links
  const processHtmlContent = (element: Element): string => {
    let content = '';
    
    // Process child nodes to preserve HTML structure
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        content += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.tagName.toLowerCase() === 'a') {
          // Preserve link structure
          const href = el.getAttribute('href') || '';
          const target = el.getAttribute('target') || '';
          const text = el.textContent || '';
          content += `<a href="${href}"${target ? ` target="${target}"` : ''}>${text}</a>`;
        } else if (el.tagName.toLowerCase() === 'strong' || el.tagName.toLowerCase() === 'b') {
          content += `<strong>${el.textContent || ''}</strong>`;
        } else if (el.tagName.toLowerCase() === 'em' || el.tagName.toLowerCase() === 'i') {
          content += `<em>${el.textContent || ''}</em>`;
        } else if (el.tagName.toLowerCase() === 'code') {
          content += `<code>${el.textContent || ''}</code>`;
        } else {
          // For other inline elements, preserve the content
          content += el.innerHTML || el.textContent || '';
        }
      }
    }
    
    return content;
  };
  
  // Process each element
  const processElement = (element: Element, index: number): GutenbergBlock | null => {
    const clientId = `block-${Date.now()}-${index}`;
    
    switch (element.tagName.toLowerCase()) {
      case 'p':
        return {
          clientId,
          name: 'core/paragraph',
          isValid: true,
          attributes: {
            content: processHtmlContent(element),
            dropCap: false
          },
          innerBlocks: []
        };
      
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return {
          clientId,
          name: 'core/heading',
          isValid: true,
          attributes: {
            content: processHtmlContent(element),
            level: parseInt(element.tagName.charAt(1))
          },
          innerBlocks: []
        };
      
      case 'figure':
        const img = element.querySelector('img');
        const figcaption = element.querySelector('figcaption');
        const imgSrc = img?.getAttribute('src') || '';
        const imgDataSrc = img?.getAttribute('data-src') || '';
        // Use data-src if src is a placeholder SVG
        const finalUrl = imgSrc.includes('data:image/svg+xml') ? imgDataSrc : imgSrc;
        return {
          clientId,
          name: 'core/image',
          isValid: true,
          attributes: {
            url: finalUrl,
            dataSrc: imgDataSrc,
            alt: img?.getAttribute('alt') || '',
            caption: figcaption?.textContent || '',
            clientId: clientId
          },
          innerBlocks: []
        };
      
      case 'img':
        const src = element.getAttribute('src') || '';
        const dataSrc = element.getAttribute('data-src') || '';
        const finalImgUrl = src.includes('data:image/svg+xml') ? dataSrc : src;
        return {
          clientId,
          name: 'core/image',
          isValid: true,
          attributes: {
            url: finalImgUrl,
            dataSrc: dataSrc,
            alt: element.getAttribute('alt') || '',
            clientId: clientId
          },
          innerBlocks: []
        };
      
      case 'ul':
      case 'ol':
        const listItems = Array.from(element.querySelectorAll('li'));
        return {
          clientId,
          name: 'core/list',
          isValid: true,
          attributes: {
            values: listItems.map(li => `<li>${li.textContent}</li>`).join(''),
            ordered: element.tagName.toLowerCase() === 'ol'
          },
          innerBlocks: []
        };
      
      case 'blockquote':
        return {
          clientId,
          name: 'core/quote',
          isValid: true,
          attributes: {
            value: element.textContent || '',
            citation: ''
          },
          innerBlocks: []
        };
      
      default:
        // For any other element, create a paragraph
        return {
          clientId,
          name: 'core/paragraph',
          isValid: true,
          attributes: {
            content: processHtmlContent(element),
            dropCap: false
          },
          innerBlocks: []
        };
    }
  };
  
  // Get all direct children of the body
  const bodyChildren = Array.from(doc.body.children);
  
  bodyChildren.forEach((element, index) => {
    const block = processElement(element, index);
    if (block) {
      blocks.push(block);
    }
  });
  
  // If no blocks were created, create a paragraph with the text content
  if (blocks.length === 0) {
    blocks.push({
      clientId: `block-${Date.now()}-0`,
      name: 'core/paragraph',
      isValid: true,
      attributes: {
        content: processHtmlContent(doc.body),
        dropCap: false
      },
      innerBlocks: []
    });
  }
  
  return blocks;
};
