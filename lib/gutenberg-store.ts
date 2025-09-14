// Simple client-side state management for Gutenberg editor
// Avoiding WordPress data store to prevent SSR issues

export interface GutenbergState {
  title: string;
  content: string;
  status: string;
  featuredImage: any;
  categories: any[];
  tags: any[];
}

export class GutenbergStore {
  private state: GutenbergState = {
    title: '',
    content: '',
    status: 'draft',
    featuredImage: null,
    categories: [],
    tags: [],
  };

  private listeners: Array<(state: GutenbergState) => void> = [];

  getState(): GutenbergState {
    return { ...this.state };
  }

  setTitle(title: string) {
    this.state.title = title;
    this.notifyListeners();
  }

  setContent(content: string) {
    this.state.content = content;
    this.notifyListeners();
  }

  setStatus(status: string) {
    this.state.status = status;
    this.notifyListeners();
  }

  setFeaturedImage(featuredImage: any) {
    this.state.featuredImage = featuredImage;
    this.notifyListeners();
  }

  setCategories(categories: any[]) {
    this.state.categories = categories;
    this.notifyListeners();
  }

  setTags(tags: any[]) {
    this.state.tags = tags;
    this.notifyListeners();
  }

  subscribe(listener: (state: GutenbergState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

// Create singleton instance
export const gutenbergStore = new GutenbergStore();