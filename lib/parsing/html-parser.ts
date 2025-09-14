// Minimal implementation of HTML parser functions for WordPress compatibility
export interface ParsedElement {
  type: 'element' | 'text';
  tag?: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: ParsedElement[];
  isVoid?: boolean;
}

export const parseHtmlToElements = (htmlContent: string): ParsedElement[] => {
  // Simple implementation - just return a single paragraph element
  return [{
    type: 'element',
    tag: 'p',
    attributes: {},
    text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags
    children: [],
    isVoid: false
  }];
};

export const convertElementsToWordPressHTML = (elements: ParsedElement[]): string => {
  // Simple implementation - just return the text content
  return elements.map(element => element.text || '').join('');
};

export const extractBase64Images = (elements: ParsedElement[]): any[] => {
  // Simple implementation - return empty array
  return [];
};

export const replaceBase64WithWordPressUrls = (elements: ParsedElement[], uploads: any[]): ParsedElement[] => {
  // Simple implementation - return elements as-is
  return elements;
};

export const base64ToFile = (base64Data: string, filename: string): File => {
  // Simple implementation - create a dummy file
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], filename, { type: 'image/jpeg' });
};

export const addWordPressClasses = (element: ParsedElement): ParsedElement => {
  // Simple implementation - return element as-is
  return element;
};

export const wrapImageWithFigure = (imageElement: ParsedElement): ParsedElement => {
  // Simple implementation - return element as-is
  return imageElement;
};
