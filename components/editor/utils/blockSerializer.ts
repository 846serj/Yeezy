import { GutenbergBlock } from '../types';

export const serializeBlocksToWordPress = (blocks: GutenbergBlock[]): string => {
  return blocks.map(block => {
    const { name, attributes } = block;
    
    switch (name) {
      case 'core/paragraph':
        return `<!-- wp:paragraph -->\n<p>${attributes.content || ''}</p>\n<!-- /wp:paragraph -->`;
      
      case 'core/heading':
        const level = attributes.level || 2;
        return `<!-- wp:heading -->\n<h${level}>${attributes.content || ''}</h${level}>\n<!-- /wp:heading -->`;
      
      case 'core/image':
        const { url, alt, caption } = attributes;
        const captionHtml = caption ? `<figcaption>${caption}</figcaption>` : '';
        return `<!-- wp:image -->\n<figure class="wp-block-image">\n<img src="${url || ''}" alt="${alt || ''}"/>\n${captionHtml}\n</figure>\n<!-- /wp:image -->`;
      
      case 'core/list':
        const { values, ordered } = attributes;
        const listTag = ordered ? 'ol' : 'ul';
        const listItems = values ? values.map((item: any) => `<li>${item}</li>`).join('\n') : '';
        return `<!-- wp:list -->\n<${listTag}>\n${listItems}\n</${listTag}>\n<!-- /wp:list -->`;
      
      case 'core/quote':
        const { value, citation } = attributes;
        return `<!-- wp:quote -->\n<blockquote>\n<p>${value || ''}</p>\n<cite>${citation || ''}</cite>\n</blockquote>\n<!-- /wp:quote -->`;
      
      default:
        return `<!-- wp:paragraph -->\n<p>${attributes.content || ''}</p>\n<!-- /wp:paragraph -->`;
    }
  }).join('\n\n');
};
