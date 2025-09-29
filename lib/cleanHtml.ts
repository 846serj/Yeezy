/**
 * Extracts content using the same serialization logic as WordPress save
 * This ensures we get exactly what would be saved to WordPress
 */

export function cleanHtmlContent(html: string): string {
  console.log('🔍 Starting WordPress block extraction...');
  
  // Try to get the blocks from the editor state
  const editorContent = document.querySelector('.editor-visual-editor');
  if (!editorContent) {
    console.log('❌ No editor content found');
    return '';
  }
  
  // Look for the block list layout which contains the actual content blocks
  const blockListLayout = editorContent.querySelector('.block-editor-block-list__layout');
  if (!blockListLayout) {
    console.log('❌ No block list layout found');
    return '';
  }
  
  console.log('📄 Found block list layout with', blockListLayout.children.length, 'children');
  
  let result = '';
  const processedContent = new Set(); // Track processed content to avoid duplicates
  
  // Process each block in the editor
  const blocks = blockListLayout.children;
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    console.log(`🔍 Block ${i}:`, block.tagName, 'classes:', block.className, 'text:', block.textContent?.trim().substring(0, 50));
    
    // Check if this block contains nested block list layout (recursive structure)
    const nestedBlockList = block.querySelector('.block-editor-block-list__layout');
    if (nestedBlockList) {
      console.log('🔍 Found nested block list, processing recursively...');
      console.log('📄 Nested block list has', nestedBlockList.children.length, 'children');
      const nestedBlocks = nestedBlockList.children;
      for (let j = 0; j < nestedBlocks.length; j++) {
        const nestedBlock = nestedBlocks[j];
        console.log(`  🔍 Nested Block ${j}:`, nestedBlock.tagName, 'classes:', nestedBlock.className, 'text:', nestedBlock.textContent?.trim().substring(0, 50));
        
        // Skip editor UI elements (only if they don't contain meaningful content)
        const rawText = nestedBlock.textContent?.trim() || '';
        const cleanText = rawText.replace(/\+/g, '').replace(/\s+/g, ' ').trim();
        const hasContent = cleanText.length > 0;
        
        console.log(`  📝 Raw text: "${rawText}", Clean text: "${cleanText}", Has content: ${hasContent}`);
        
        if ((nestedBlock.querySelector('button') || 
            nestedBlock.getAttribute('style')?.includes('display: flex') ||
            nestedBlock.getAttribute('style')?.includes('cursor: pointer') ||
            nestedBlock.getAttribute('style')?.includes('opacity: 0')) && 
            !hasContent) {
          console.log('  ⏭️ Skipping nested UI element (no meaningful content)');
          continue;
        }
        
        // Process the nested block
        const blockResult = processBlock(nestedBlock);
        console.log(`  📋 Block result: "${blockResult}"`);
        if (blockResult) {
          result += blockResult;
        }
      }
    } else {
      // If no nested block list, look for all divs with content inside this block
      console.log('🔍 No nested block list found, looking for content divs...');
      const contentDivs = block.querySelectorAll('div[class*="wp-block"], div[class*="heading-input"], figure, div[data-block-id]');
      console.log('📄 Found', contentDivs.length, 'content divs');
      
      for (let k = 0; k < contentDivs.length; k++) {
        const contentDiv = contentDivs[k];
        console.log(`  🔍 Content Div ${k}:`, contentDiv.tagName, 'classes:', contentDiv.className, 'text:', contentDiv.textContent?.trim().substring(0, 50));
        
        // Check for images in this div
        const images = contentDiv.querySelectorAll('img');
        if (images.length > 0) {
          console.log(`  🖼️ Found ${images.length} image(s) in content div ${k}`);
          images.forEach((img, idx) => {
            console.log(`    🖼️ Image ${idx}: ${img.src}`);
          });
        }
        
        // Skip editor UI elements (only if they don't contain meaningful content)
        const rawText = contentDiv.textContent?.trim() || '';
        const cleanText = rawText.replace(/\+/g, '').replace(/\s+/g, ' ').trim();
        const hasContent = cleanText.length > 0;
        
        console.log(`  📝 Raw text: "${rawText}", Clean text: "${cleanText}", Has content: ${hasContent}`);
        
        if ((contentDiv.querySelector('button') || 
            contentDiv.getAttribute('style')?.includes('display: flex') ||
            contentDiv.getAttribute('style')?.includes('cursor: pointer') ||
            contentDiv.getAttribute('style')?.includes('opacity: 0')) && 
            !hasContent) {
          console.log('  ⏭️ Skipping content UI element (no meaningful content)');
          continue;
        }
        
        // Process the content div
        const blockResult = processBlock(contentDiv);
        console.log(`  📋 Content div result: "${blockResult}"`);
        if (blockResult) {
          // Extract the text content for better deduplication
          const textContent = contentDiv.textContent?.trim() || '';
          const cleanText = textContent.replace(/\+/g, '').replace(/\s+/g, ' ').trim();
          
          // Create a more intelligent hash that considers content type and text
          const isHeading = contentDiv.classList.contains('heading-input') || contentDiv.classList.contains('wp-block-heading');
          const isImage = contentDiv.querySelector('img') || contentDiv.tagName === 'FIGURE';
          const contentKey = `${isHeading ? 'heading' : isImage ? 'image' : 'text'}:${cleanText}`;
          
          if (!processedContent.has(contentKey)) {
            processedContent.add(contentKey);
            result += blockResult;
            console.log(`  ✅ Added unique content (${isHeading ? 'heading' : isImage ? 'image' : 'text'})`);
          } else {
            console.log(`  ⏭️ Skipping duplicate content (${isHeading ? 'heading' : isImage ? 'image' : 'text'})`);
          }
        }
      }
    }
  }
  
  console.log('📋 Final result before cleanup:', result);
  
  // Clean up duplicate headings that appear as paragraphs
  const lines = result.split('\n');
  const cleanedLines = [];
  const headingTexts = new Set();
  
  // First pass: collect all heading texts
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<!-- wp:heading -->')) {
      // Find the heading text in the next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const headingLine = lines[j];
        if (headingLine.includes('<h')) {
          const headingText = headingLine.replace(/<[^>]*>/g, '').trim();
          if (headingText) {
            headingTexts.add(headingText);
            console.log(`📋 Found heading text: "${headingText}"`);
          }
          break;
        }
      }
    }
  }
  
  // Second pass: filter out paragraphs that match heading texts
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<!-- wp:paragraph -->')) {
      // Check if this paragraph contains heading text
      let isHeadingParagraph = false;
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const paragraphLine = lines[j];
        if (paragraphLine.includes('<p>')) {
          const paragraphText = paragraphLine.replace(/<[^>]*>/g, '').trim();
          if (headingTexts.has(paragraphText)) {
            console.log(`🧹 Removing duplicate heading paragraph: "${paragraphText}"`);
            isHeadingParagraph = true;
            // Skip this entire paragraph block
            while (i < lines.length && !lines[i].includes('<!-- /wp:paragraph -->')) {
              i++;
            }
            break;
          }
        }
      }
      if (!isHeadingParagraph) {
        cleanedLines.push(line);
      }
    } else {
      cleanedLines.push(line);
    }
  }
  
  const cleanedResult = cleanedLines.join('\n');
  console.log('📋 Final cleaned result:', cleanedResult);
  return cleanedResult.trim();
}

function processBlock(block: Element): string {
  // Check if it's a heading
  if (block.classList.contains('heading-input--h1') || block.classList.contains('heading-input--h2')) {
    const text = block.textContent?.trim();
    if (text) {
      const level = block.classList.contains('heading-input--h1') ? 'h1' : 'h2';
      console.log(`📝 Found heading: ${text}`);
      return `<!-- wp:heading -->\n<${level}>${text}</${level}>\n<!-- /wp:heading -->\n\n`;
    }
  }
  // Check if it's a paragraph
  else if (block.classList.contains('wp-block') && !block.classList.contains('heading-input')) {
    const text = block.textContent?.trim();
    if (text && text.length > 0) {
      // Clean up the text by removing + characters and extra whitespace
      const cleanText = text.replace(/\+/g, '').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 0) {
        console.log(`📝 Found paragraph: ${cleanText.substring(0, 50)}...`);
        return `<!-- wp:paragraph -->\n<p>${cleanText}</p>\n<!-- /wp:paragraph -->\n\n`;
      }
    }
  }
  // Check if it's an image
  else if (block.querySelector('img')) {
    const img = block.querySelector('img');
    const figcaption = block.querySelector('figcaption');
    if (img) {
      console.log(`🖼️ Found image: ${img.src}`);
      const captionHtml = figcaption ? `<figcaption>${figcaption.textContent}</figcaption>` : '';
      return `<!-- wp:image -->\n<figure class="wp-block-image">\n<img src="${img.src}" alt="${img.alt || ''}"/>\n${captionHtml}\n</figure>\n<!-- /wp:image -->\n\n`;
    }
  }
  // Check if it's a figure with image (alternative structure)
  else if (block.querySelector('figure')) {
    const figure = block.querySelector('figure');
    const img = figure?.querySelector('img');
    const figcaption = figure?.querySelector('figcaption');
    if (img) {
      console.log(`🖼️ Found figure with image: ${img.src}`);
      const captionHtml = figcaption ? `<figcaption>${figcaption.textContent}</figcaption>` : '';
      return `<!-- wp:image -->\n<figure class="wp-block-image">\n<img src="${img.src}" alt="${img.alt || ''}"/>\n${captionHtml}\n</figure>\n<!-- /wp:image -->\n\n`;
    }
  }
  // Check if it's a list
  else if (block.querySelector('ul') || block.querySelector('ol')) {
    const list = block.querySelector('ul') || block.querySelector('ol');
    if (list) {
      console.log(`📋 Found list: ${list.tagName}`);
      const listTag = list.tagName.toLowerCase();
      const items = Array.from(list.querySelectorAll('li')).map(li => `<li>${li.textContent}</li>`).join('\n');
      return `<!-- wp:list -->\n<${listTag}>\n${items}\n</${listTag}>\n<!-- /wp:list -->\n\n`;
    }
  }
  // Check if it's a quote
  else if (block.querySelector('blockquote')) {
    const blockquote = block.querySelector('blockquote');
    const p = blockquote?.querySelector('p');
    const cite = blockquote?.querySelector('cite');
    if (p) {
      console.log(`💬 Found quote: ${p.textContent?.substring(0, 50)}...`);
      const citation = cite ? `<cite>${cite.textContent}</cite>` : '';
      return `<!-- wp:quote -->\n<blockquote>\n<p>${p.textContent}</p>\n${citation}\n</blockquote>\n<!-- /wp:quote -->\n\n`;
    }
  }
  else {
    console.log('❓ Unknown block type, checking for text content...');
    const text = block.textContent?.trim();
    if (text && text.length > 0) {
      // Clean up the text by removing + characters and extra whitespace
      const cleanText = text.replace(/\+/g, '').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 0) {
        console.log(`📝 Found text content: ${cleanText.substring(0, 50)}...`);
        return `<!-- wp:paragraph -->\n<p>${cleanText}</p>\n<!-- /wp:paragraph -->\n\n`;
      }
    }
  }
  
  return '';
}
