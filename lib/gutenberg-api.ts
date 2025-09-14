import { WordPressPost } from '@/types';

export interface GutenbergBlock {
  clientId: string;
  name: string;
  isValid: boolean;
  attributes: Record<string, any>;
  innerBlocks: GutenbergBlock[];
}

export interface GutenbergPost {
  id?: number;
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'private' | 'pending';
  excerpt?: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  blocks?: GutenbergBlock[];
}

export class GutenbergAPI {
  private baseUrl: string;
  private username: string;
  private appPassword: string;

  constructor(baseUrl: string, username: string, appPassword: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.username = username;
    this.appPassword = appPassword;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const credentials = btoa(`${this.username}:${this.appPassword}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Parse Gutenberg comment format (<!-- wp:block -->)
  parseGutenbergComments(content: string): GutenbergBlock[] {
    const blocks: GutenbergBlock[] = [];
    let clientId = 1;
    
    // Regular expression to match Gutenberg comment blocks
    const blockRegex = /<!-- wp:(\w+)(?:\s+({[^}]*}))? -->\s*([\s\S]*?)\s*<!-- \/wp:\1 -->/g;
    
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      const [, blockType, attributesJson, blockContent] = match;
      
      try {
        const attributes = attributesJson ? JSON.parse(attributesJson) : {};
        
        switch (blockType) {
          case 'image':
            // Parse the HTML content inside the image block
            const parser = new DOMParser();
            const doc = parser.parseFromString(blockContent, 'text/html');
            const figure = doc.querySelector('figure');
            
            if (figure) {
              const img = figure.querySelector('img');
              const figcaption = figure.querySelector('figcaption');
              
              if (img) {
                // Handle lazy-loaded images - use data-src if src is a placeholder
                const imageUrl = img.src.includes('data:image/svg+xml') && img.dataset.src 
                  ? img.dataset.src 
                  : img.src;
                
                blocks.push({
                  clientId: (clientId++).toString(),
                  name: 'core/image',
                  isValid: true,
                  attributes: {
                    url: imageUrl,
                    alt: img.alt || '',
                    caption: figcaption ? figcaption.textContent || '' : '',
                    id: attributes.id || null,
                    sizeSlug: attributes.sizeSlug || 'large',
                    className: attributes.className || '',
                  },
                  innerBlocks: [],
                });
              }
            }
            break;
            
          case 'heading':
            const headingMatch = blockContent.match(/<h([1-6])[^>]*class="[^"]*wp-block-heading[^"]*"[^>]*>(.*?)<\/h[1-6]>/);
            if (headingMatch) {
              const [, level, text] = headingMatch;
              blocks.push({
                clientId: (clientId++).toString(),
                name: 'core/heading',
                isValid: true,
                attributes: {
                  content: text.trim(),
                  level: parseInt(level),
                },
                innerBlocks: [],
              });
            }
            break;
            
          case 'paragraph':
            const paragraphMatch = blockContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
            if (paragraphMatch) {
              const [, text] = paragraphMatch;
              blocks.push({
                clientId: (clientId++).toString(),
                name: 'core/paragraph',
                isValid: true,
                attributes: {
                  content: text.trim(),
                  placeholder: 'Start writing or type / to choose a block',
                },
                innerBlocks: [],
              });
            }
            break;
            
          case 'quote':
            const quoteMatch = blockContent.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/);
            if (quoteMatch) {
              const [, text] = quoteMatch;
              blocks.push({
                clientId: (clientId++).toString(),
                name: 'core/quote',
                isValid: true,
                attributes: {
                  value: text.trim(),
                  citation: '',
                },
                innerBlocks: [],
              });
            }
            break;
            
          default:
            // For unknown block types, try to parse as generic content
            const textContent = blockContent.replace(/<[^>]*>/g, '').trim();
            if (textContent) {
              blocks.push({
                clientId: (clientId++).toString(),
                name: 'core/paragraph',
                isValid: true,
                attributes: {
                  content: textContent,
                  placeholder: 'Start writing or type / to choose a block',
                },
                innerBlocks: [],
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing block:', blockType, error);
        // Continue with next block
      }
    }
    
    console.log('parseGutenbergComments - Parsed blocks:', blocks);
    return blocks;
  }

  // Convert HTML content to Gutenberg blocks
  parseHtmlToBlocks(htmlContent: string): GutenbergBlock[] {
    const blocks: GutenbergBlock[] = [];
    
    // Check if content is in Gutenberg comment format
    if (htmlContent.includes('<!-- wp:')) {
      return this.parseGutenbergComments(htmlContent);
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    console.log('parseHtmlToBlocks - HTML content:', htmlContent);
    console.log('parseHtmlToBlocks - Body children:', Array.from(doc.body.children).map(el => el.tagName));
    console.log('parseHtmlToBlocks - All img elements:', Array.from(doc.querySelectorAll('img')).map(img => img.src));
    
    let clientId = 1;
    
    const parseElement = (element: Element): GutenbergBlock | null => {
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'p':
          return {
            clientId: (clientId++).toString(),
            name: 'core/paragraph',
            isValid: true,
            attributes: {
              content: element.textContent || '',
              placeholder: 'Start writing or type / to choose a block',
            },
            innerBlocks: [],
          };
          
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return {
            clientId: (clientId++).toString(),
            name: 'core/heading',
            isValid: true,
            attributes: {
              content: element.textContent || '',
              level: parseInt(tagName.charAt(1)),
            },
            innerBlocks: [],
          };
          
        case 'img':
          const img = element as HTMLImageElement;
          return {
            clientId: (clientId++).toString(),
            name: 'core/image',
            isValid: true,
            attributes: {
              url: img.src,
              alt: img.alt || '',
              caption: '',
            },
            innerBlocks: [],
          };
          
        case 'figure':
          // Handle figure elements with captions
          const figureImg = element.querySelector('img');
          const figcaption = element.querySelector('figcaption');
          
          if (figureImg) {
            // Handle lazy-loaded images - use data-src if src is a placeholder
            const imageUrl = figureImg.src.includes('data:image/svg+xml') && figureImg.dataset.src 
              ? figureImg.dataset.src 
              : figureImg.src;
            
            return {
              clientId: (clientId++).toString(),
              name: 'core/image',
              isValid: true,
              attributes: {
                url: imageUrl,
                alt: figureImg.alt || '',
                caption: figcaption ? figcaption.textContent || '' : '',
              },
              innerBlocks: [],
            };
          }
          return null;
          
        case 'blockquote':
          return {
            clientId: (clientId++).toString(),
            name: 'core/quote',
            isValid: true,
            attributes: {
              value: element.textContent || '',
              citation: '',
            },
            innerBlocks: [],
          };
          
        case 'ul':
          const listItems = Array.from(element.querySelectorAll('li'));
          return {
            clientId: (clientId++).toString(),
            name: 'core/list',
            isValid: true,
            attributes: {
              values: listItems.map(li => `<li>${li.textContent}</li>`).join(''),
              ordered: false,
            },
            innerBlocks: [],
          };
          
        case 'ol':
          const orderedListItems = Array.from(element.querySelectorAll('li'));
          return {
            clientId: (clientId++).toString(),
            name: 'core/list',
            isValid: true,
            attributes: {
              values: orderedListItems.map(li => `<li>${li.textContent}</li>`).join(''),
              ordered: true,
            },
            innerBlocks: [],
          };
          
        default:
          return null;
      }
    };

    // Parse all elements in order, handling nested content properly
    const parseElementRecursively = (element: Element): GutenbergBlock[] => {
      const elementBlocks: GutenbergBlock[] = [];
      const tagName = element.tagName.toLowerCase();
      
      // Check if this element itself should be a block
      const directBlock = parseElement(element);
      if (directBlock) {
        elementBlocks.push(directBlock);
      } else {
        // If not a direct block, check for nested content
        if (tagName === 'p') {
          // For paragraphs, check if they contain images
          const images = element.querySelectorAll('img');
          if (images.length > 0) {
            // Split paragraph content around images
            const textContent = element.textContent || '';
            const imageElements = Array.from(images);
            
            // Create text blocks and image blocks in order
            let lastIndex = 0;
            imageElements.forEach((img, index) => {
              // Add text before image
              const beforeText = textContent.substring(lastIndex, textContent.indexOf(img.alt || '', lastIndex));
              if (beforeText.trim()) {
                elementBlocks.push({
                  clientId: (clientId++).toString(),
                  name: 'core/paragraph',
                  isValid: true,
                  attributes: {
                    content: beforeText.trim(),
                    placeholder: 'Start writing or type / to choose a block',
                  },
                  innerBlocks: [],
                });
              }
              
              // Add image block
              const imgBlock = parseElement(img);
              if (imgBlock) {
                elementBlocks.push(imgBlock);
              }
              
              lastIndex = textContent.indexOf(img.alt || '', lastIndex) + (img.alt || '').length;
            });
            
            // Add remaining text after last image
            const remainingText = textContent.substring(lastIndex);
            if (remainingText.trim()) {
              elementBlocks.push({
                clientId: (clientId++).toString(),
                name: 'core/paragraph',
                isValid: true,
                attributes: {
                  content: remainingText.trim(),
                  placeholder: 'Start writing or type / to choose a block',
                },
                innerBlocks: [],
              });
            }
          } else {
            // Regular paragraph without images
            elementBlocks.push({
              clientId: (clientId++).toString(),
              name: 'core/paragraph',
              isValid: true,
              attributes: {
                content: element.textContent || '',
                placeholder: 'Start writing or type / to choose a block',
              },
              innerBlocks: [],
            });
          }
        } else {
          // For other elements, process children recursively
          Array.from(element.children).forEach(child => {
            elementBlocks.push(...parseElementRecursively(child));
          });
        }
      }
      
      return elementBlocks;
    };
    
    // Parse all direct children in order
    Array.from(doc.body.children).forEach(child => {
      blocks.push(...parseElementRecursively(child));
    });

    return blocks;
  }

  // Convert Gutenberg blocks to HTML
  blocksToHtml(blocks: GutenbergBlock[]): string {
    return blocks.map(block => {
      switch (block.name) {
        case 'core/paragraph':
          return `<p>${block.attributes.content || ''}</p>`;
          
        case 'core/heading':
          const level = block.attributes.level || 1;
          return `<h${level}>${block.attributes.content || ''}</h${level}>`;
          
        case 'core/image':
          const { url, alt, caption } = block.attributes;
          return `<figure class="wp-block-image">
            <img src="${url}" alt="${alt || ''}" />
            ${caption ? `<figcaption>${caption}</figcaption>` : ''}
          </figure>`;
          
        case 'core/quote':
          const { value, citation } = block.attributes;
          return `<blockquote class="wp-block-quote">
            <p>${value}</p>
            ${citation ? `<cite>${citation}</cite>` : ''}
          </blockquote>`;
          
        case 'core/list':
          const { values, ordered } = block.attributes;
          const tag = ordered ? 'ol' : 'ul';
          return `<${tag} class="wp-block-list">${values}</${tag}>`;
          
        default:
          return '';
      }
    }).join('');
  }

  // Get posts
  async getPosts(page = 1, perPage = 10): Promise<{ posts: WordPressPost[]; totalPages: number }> {
    const response = await this.makeRequest(`/posts?page=${page}&per_page=${perPage}`);
    return {
      posts: response,
      totalPages: parseInt(response.headers?.['X-WP-TotalPages'] || '1'),
    };
  }

  // Get single post
  async getPost(id: number): Promise<WordPressPost> {
    return this.makeRequest(`/posts/${id}`);
  }

  // Create post
  async createPost(post: GutenbergPost): Promise<WordPressPost> {
    const htmlContent = post.blocks ? this.blocksToHtml(post.blocks) : post.content;
    
    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: post.title,
        content: htmlContent,
        status: post.status,
        excerpt: post.excerpt || '',
        featured_media: post.featured_media || 0,
        categories: post.categories || [],
        tags: post.tags || [],
      }),
    });
  }

  // Update post
  async updatePost(id: number, post: Partial<GutenbergPost>): Promise<WordPressPost> {
    const updateData: any = {};
    
    if (post.title) updateData.title = post.title;
    if (post.status) updateData.status = post.status;
    if (post.excerpt) updateData.excerpt = post.excerpt;
    if (post.featured_media !== undefined) updateData.featured_media = post.featured_media;
    if (post.categories) updateData.categories = post.categories;
    if (post.tags) updateData.tags = post.tags;
    
    if (post.blocks) {
      updateData.content = this.blocksToHtml(post.blocks);
    } else if (post.content) {
      updateData.content = post.content;
    }

    return this.makeRequest(`/posts/${id}`, {
      method: 'POST',
      body: JSON.stringify(updateData),
    });
  }

  // Upload media
  async uploadMedia(file: File, altText?: string, caption?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('alt_text', altText);
    if (caption) formData.append('caption', caption);

    const credentials = btoa(`${this.username}:${this.appPassword}`);
    
    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Media upload error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get categories
  async getCategories(): Promise<any[]> {
    return this.makeRequest('/categories');
  }

  // Get tags
  async getTags(): Promise<any[]> {
    return this.makeRequest('/tags');
  }
}

export default GutenbergAPI;
