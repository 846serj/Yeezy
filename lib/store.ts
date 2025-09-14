import { create } from 'zustand';
import { WordPressSite, WordPressPost, WordPressMedia, WordPressCategory, WordPressTag, EditorContent } from '@/types';
import { WordPressAPIV2Fallback } from '@/lib/wordpress-api-v2-fallback';

interface WordPressStore {
  // Connection state
  site: WordPressSite | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  api: WordPressAPIV2Fallback | null;

  // Data state
  articles: WordPressPost[];
  currentArticle: WordPressPost | null;
  media: WordPressMedia[];
  categories: WordPressCategory[];
  tags: WordPressTag[];

  // Actions
  setSite: (site: WordPressSite | null) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setApi: (api: WordPressAPIV2Fallback | null) => void;
  setArticles: (articles: WordPressPost[]) => void;
  setCurrentArticle: (article: WordPressPost | null) => void;
  setMedia: (media: WordPressMedia[]) => void;
  setCategories: (categories: WordPressCategory[]) => void;
  setTags: (tags: WordPressTag[]) => void;
  reset: () => void;
}

export const useWordPressStore = create<WordPressStore>((set) => ({
  // Initial state
  site: null,
  isConnected: false,
  loading: false,
  error: null,
  api: null,
  articles: [],
  currentArticle: null,
  media: [],
  categories: [],
  tags: [],

  // Actions
  setSite: (site) => set({ site }),
  setConnected: (isConnected) => set({ isConnected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setApi: (api) => set({ api }),
  setArticles: (articles) => set({ articles }),
  setCurrentArticle: (currentArticle) => set({ currentArticle }),
  setMedia: (media) => set({ media }),
  setCategories: (categories) => set({ categories }),
  setTags: (tags) => set({ tags }),
  reset: () => set({
    site: null,
    isConnected: false,
    loading: false,
    error: null,
    api: null,
    articles: [],
    currentArticle: null,
    media: [],
    categories: [],
    tags: [],
  }),
}));
