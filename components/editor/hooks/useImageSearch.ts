import { useState } from 'react';
import { ImageResult } from '../types';

export const useImageSearch = () => {
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [searchImages, setSearchImages] = useState<ImageResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(['unsplash', 'pexels', 'pixabay', 'flickr', 'nasa', 'wikiCommons']);
  const [hasMoreImages, setHasMoreImages] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');

  const handleImageSearch = async (query: string, loadMore = false) => {
    if (!query.trim() && !loadMore) return;
    
    setSearchLoading(true);
    try {
      const searchQuery = loadMore ? lastSearchQuery : query;
      if (!loadMore) {
        setLastSearchQuery(query);
      }
      
      const page = loadMore ? searchPage + 1 : 1;
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(searchQuery)}&sources=${selectedSources.join(',')}&page=${page}&perPage=20`);
      const data = await response.json();
      
      if (loadMore) {
        setSearchImages(prev => [...prev, ...data.images]);
        setSearchPage(prev => prev + 1);
      } else {
        setSearchImages(data.images);
        setSearchPage(1);
      }
      setHasMoreImages(data.hasMore);
    } catch (error) {
      console.error('Image search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        // If trying to deselect the last source, don't allow it
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const openImageSearch = (blockId: string) => {
    
    setShowImageSearch(true);
    setSearchImages([]);
    
  };

  const closeImageSearch = () => {
    setShowImageSearch(false);
    setSearchImages([]);
    setSearchPage(1);
    setLastSearchQuery('');
  };

  return {
    showImageSearch,
    setShowImageSearch,
    searchImages,
    searchLoading,
    selectedSources,
    hasMoreImages,
    lastSearchQuery,
    handleImageSearch,
    handleSourceToggle,
    openImageSearch,
    closeImageSearch
  };
};
