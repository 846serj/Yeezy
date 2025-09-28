import React, { useState, useEffect, useCallback } from 'react';

interface BlockInserterProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (blockType: string, attributes?: Record<string, any>) => void;
  onAddImage?: (image: any) => void;
}

interface ImageResult {
  url: string;
  thumbnail?: string;
  caption?: string;
  attribution?: string;
  source?: string;
  photographer?: string;
  photographerUrl?: string;
  downloadLocation?: string;
}

export const BlockInserter: React.FC<BlockInserterProps> = ({ 
  isOpen, 
  onClose, 
  onAddBlock,
  onAddImage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImageResults, setShowImageResults] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedSources, setSelectedSources] = useState<string[]>(['unsplash', 'pexels', 'pixabay', 'openverse', 'wikiCommons']);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (query: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (query.trim()) {
            handleImageSearch(query);
          } else {
            setShowImageResults(false);
            setImages([]);
          }
        }, 300);
      };
    })(),
    []
  );

  const handleImageSearch = async (query: string, loadMore = false) => {
    if (!query.trim()) {
      setShowImageResults(false);
      setImages([]);
      return;
    }
    
    setLoading(true);
    setShowImageResults(true);
    
    try {
      const response = await fetch(`/api/search-images?query=${encodeURIComponent(query)}&sources=${selectedSources.join(',')}&page=${loadMore ? page + 1 : 1}&perPage=20`);
      const data = await response.json();
      
      if (loadMore) {
        setImages(prev => [...prev, ...data.images]);
        setPage(prev => prev + 1);
      } else {
        setImages(data.images);
        setPage(1);
      }
      
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Image search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleImageSelect = (image: ImageResult) => {
    if (onAddImage) {
      onAddImage(image);
    } else {
      // Fallback to adding as image block
      onAddBlock('core/image', { 
        url: image.url, 
        alt: image.caption || '', 
        caption: image.attribution || '' 
      });
    }
    onClose();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Re-search when selectedSources changes and there's an active search
  useEffect(() => {
    if (searchQuery.trim() && showImageResults) {
      setPage(1);
      handleImageSearch(searchQuery, false);
    }
  }, [selectedSources]);

  if (!isOpen) return null;

  const blockTypes = [
    {
      name: 'core/paragraph',
      title: 'Paragraph',
      description: 'Start with the building block of all narrative.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="m9.99609 14v-.2251l.00391.0001v6.225h1.5v-14.5h2.5v14.5h1.5v-14.5h3v-1.5h-8.50391c-2.76142 0-5 2.23858-5 5 0 2.7614 2.23858 5 5 5z"></path>
        </svg>
      )
    },
    {
      name: 'core/heading',
      title: 'Heading',
      description: 'Introduce new sections and organize content.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M6 5V18.5911L12 13.8473L18 18.5911V5H6Z"></path>
        </svg>
      )
    },
    {
      name: 'core/image',
      title: 'Image',
      description: 'Insert an image to make a visual statement.',
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z"></path>
        </svg>
      )
    },
    {
      name: 'core/list',
      title: 'List',
      description: 'Create a bulleted or numbered list.',
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M4 4v1.5h16V4H4zm8 8.5h8V11h-8v1.5zM4 20h16v-1.5H4V20zm4-8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z"></path>
        </svg>
      )
    },
    {
      name: 'core/quote',
      title: 'Quote',
      description: 'Give quoted text visual emphasis.',
      icon: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false">
          <path d="M13 6v6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H13zm-9 6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H4v6z"></path>
        </svg>
      )
    }
  ];

  const handleAddBlock = (blockType: string, attributes: Record<string, any> = {}) => {
    onAddBlock(blockType, attributes);
    onClose();
  };

  return (
    <div
      className="components-popover components-dropdown__content block-editor-inserter__popover is-quick is-positioned"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 1,
        zIndex: 1000000,
        margin: 0,
        width: '550px',
        maxWidth: '90vw',
        boxShadow: '0 var(--space-3) var(--space-30) rgba(25, 30, 35, 0.2)',
        borderRadius: 'var(--space-8)',
        border: 'var(--space-1) solid #ddd',
        backgroundColor: 'white',
        padding: 'var(--space-16)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
      }}
    >
      <div className="block-editor-inserter__quick-inserter">
        {/* Search Input */}
        <div className="block-editor-inserter__search" style={{ marginBottom: 'var(--space-8)' }}>
          <input
            type="text"
            placeholder="Search for an image..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: 'var(--space-8) var(--space-12)',
              border: 'var(--space-1) solid #ddd',
              borderRadius: 'var(--space-4)',
              fontSize: 'var(--space-14)',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#007cba'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
          />
        </div>

        {/* API Selection Buttons */}
        <div className="block-editor-inserter__block-list" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="block-editor-block-types-list">
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('getty') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('getty')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('getty')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('getty')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Getty API</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('pexels') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('pexels')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('pexels')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('pexels')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Pexels</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('shutterstock') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('shutterstock')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('shutterstock')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('shutterstock')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Shutterstock API</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('unsplash') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('unsplash')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('unsplash')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('unsplash')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Unsplash</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('pixabay') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('pixabay')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('pixabay')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#ddd';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('pixabay')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div style={{ 
                fontWeight: '600', 
                fontSize: 'var(--space-14)', 
                color: 'rgb(30, 30, 30)'
              }}>Pixabay</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('flickr') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('flickr')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('flickr')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('flickr')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Flickr</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('nasa') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('nasa')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('nasa')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('nasa')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>NASA</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('rawpixel') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('rawpixel')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('rawpixel')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('rawpixel')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Rawpixel</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('inaturalist') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('inaturalist')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('inaturalist')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('inaturalist')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>iNaturalist</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('stocksnap') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('stocksnap')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('stocksnap')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('stocksnap')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>StockSnap.io</div>
            </div>
            
            <div 
              className="block-editor-block-types-list__item" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 'var(--space-8) var(--space-12)', 
                cursor: 'pointer', 
                border: 'var(--space-1) solid transparent', 
                borderRadius: 'var(--space-4)', 
                marginBottom: 'var(--space-2)', 
                transition: '0.2s',
                backgroundColor: selectedSources.includes('wikiCommons') ? '#e3f2fd' : 'transparent'
              }}
              onClick={() => handleSourceToggle('wikiCommons')}
              onMouseEnter={(e) => {
                if (!selectedSources.includes('wikiCommons')) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedSources.includes('wikiCommons')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: 'var(--space-14)', color: 'rgb(30, 30, 30)' }}>Wiki Commons</div>
            </div>
          </div>
        </div>
        
        <div className="block-editor-inserter__block-list">
          {showImageResults && images.length > 0 ? (
            <div>
              <div style={{ 
                fontSize: 'var(--space-14)', 
                fontWeight: '600', 
                color: '#1e1e1e', 
                marginBottom: 'var(--space-12)',
                padding: 'var(--space-8) 0',
                borderBottom: 'var(--space-1) solid var(--color-gray-200)'
              }}>
                {`Image Results for "${searchQuery}"`}
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(var(--space-200), 1fr))', 
                gap: 'var(--space-12)',
                maxHeight: 'var(--space-400)',
                overflowY: 'auto'
              }}>
                {images.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    onClick={() => handleImageSelect(image)}
                    style={{
                      cursor: 'pointer',
                      border: 'var(--space-1) solid #ddd',
                      borderRadius: 'var(--space-4)',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#007cba';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={image.thumbnail || image.url}
                      alt={image.caption || 'Image'}
                      style={{
                        width: '100%',
                        height: 'var(--space-160)',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{
                      padding: 'var(--space-4) var(--space-6)',
                      fontSize: 'var(--space-10)',
                      color: '#666',
                      lineHeight: '1.2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {(image.source === 'unsplash' || image.source === 'pixabay' || image.source === 'flickr' || image.source === 'nasa' || image.source === 'rawpixel' || image.source === 'inaturalist' || image.source === 'stocksnap') && image.photographerUrl ? (
                        <a
                          href={image.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#007cba',
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          {image.attribution || image.caption || 'Image'}
                        </a>
                      ) : (
                        image.attribution || image.caption || 'Image'
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 'var(--space-12)',
                  padding: 'var(--space-8) 0',
                  borderTop: 'var(--space-1) solid var(--color-gray-200)'
                }}>
                  <button
                    onClick={() => handleImageSearch(searchQuery, true)}
                    disabled={loading}
                    style={{
                      padding: 'var(--space-8) var(--space-16)',
                      backgroundColor: loading ? '#f5f5f5' : '#007cba',
                      color: loading ? '#999' : 'white',
                      border: 'none',
                      borderRadius: 'var(--space-4)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--space-14)',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#005a87';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#007cba';
                      }
                    }}
                  >
                    {loading ? 'Loading...' : 'Load More Images'}
                  </button>
                </div>
              )}
            </div>
          ) : showImageResults && loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-20)',
              color: '#666'
            }}>
              Searching for images...
            </div>
          ) : showImageResults && images.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--space-20)',
              color: '#666'
            }}>
              {`No images found for "${searchQuery}"`}
            </div>
          ) : (
            <div className="block-editor-block-types-list" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-8)',
              padding: 'var(--space-16)'
            }}>
              {blockTypes.map((block) => (
                <button
                  key={block.name}
                  type="button"
                  role="option"
                  tabIndex={0}
                  className="components-button block-editor-block-types-list__item"
                  onClick={() => handleAddBlock(block.name, { content: `New ${block.title.toLowerCase()} block` })}
                  style={{
                    width: '100%',
                    padding: 'var(--space-16) var(--space-12)',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-8)',
                    borderRadius: 'var(--space-4)',
                    transition: 'all 0.15s ease',
                    fontSize: 'var(--space-13)',
                    lineHeight: '1.4',
                    color: '#1e1e1e',
                    minHeight: 'var(--space-100)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                    e.currentTarget.style.color = '#007cba';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1e1e1e';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                    e.currentTarget.style.color = '#007cba';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1e1e1e';
                  }}
                >
                  <span className="block-editor-block-types-list__item-icon" style={{
                    width: 'var(--space-32)',
                    height: 'var(--space-32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="block-editor-block-icon has-colors">
                      {block.icon}
                    </span>
                  </span>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    width: '100%'
                  }}>
                    <div style={{ 
                      fontWeight: '500', 
                      fontSize: 'var(--space-13)',
                      lineHeight: '1.4',
                      textAlign: 'center'
                    }}>
                      {block.title}
                    </div>
                    <div style={{ 
                      fontSize: 'var(--space-11)', 
                      color: '#666',
                      lineHeight: '1.3',
                      textAlign: 'center',
                      maxWidth: '100%',
                      wordWrap: 'break-word'
                    }}>
                      {block.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
