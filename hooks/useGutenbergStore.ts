'use client';

import { useState, useEffect } from 'react';
import { gutenbergStore, GutenbergState } from '@/lib/gutenberg-store';

export const useGutenbergStore = () => {
  const [state, setState] = useState<GutenbergState>(gutenbergStore.getState());

  useEffect(() => {
    const unsubscribe = gutenbergStore.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    setTitle: gutenbergStore.setTitle.bind(gutenbergStore),
    setContent: gutenbergStore.setContent.bind(gutenbergStore),
    setStatus: gutenbergStore.setStatus.bind(gutenbergStore),
    setFeaturedImage: gutenbergStore.setFeaturedImage.bind(gutenbergStore),
    setCategories: gutenbergStore.setCategories.bind(gutenbergStore),
    setTags: gutenbergStore.setTags.bind(gutenbergStore),
  };
};
