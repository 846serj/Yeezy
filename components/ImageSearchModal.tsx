"use client";

import React, { FC, useState, useCallback, useEffect } from "react";
import { createPortal } from 'react-dom';

const sourceLabels: Record<string, string> = {
  all:         "All",
  unsplash:    "Unsplash",
  pexels:      "Pexels",
  pixabay:     "Pixabay",
  flickr:      "Flickr",
  nasa:        "NASA",
  rawpixel:    "Rawpixel",
  inaturalist: "iNaturalist",
  stocksnap:   "StockSnap.io",
  wikiCommons: "Wiki Commons",
  shutterstock: "Shutterstock",
  getty:       "Getty",
  wpMedia:     "WordPress Media",
  internet:    "Internet",
};

export interface ImageResult {
  url:        string;
  full:       string;
  caption:    string;
  source:     string;
  thumbnail?: string;
  imageId?:   string;
  assets?:    { preview_1500?: { url: string } };
  link?:      string;
  title?:     string;
  photographer?: string;
  photographerUrl?: string;
  attribution?: string;
}

interface Props {
  isOpen:           boolean;
  selectedSources:  string[];
  onSourceToggle:   (source: string) => void;
  onSearch:         (query: string, loadMore?: boolean) => void;
  onSelect:         (img: ImageResult) => void;
  onClose:          () => void;
  images:           ImageResult[];
  loading:          boolean;
  hasMore:          boolean;
  loadMore:         () => void;
}

const ImageSearchModal: FC<Props> = ({
  isOpen,
  selectedSources,
  onSourceToggle,
  onSearch,
  onSelect,
  onClose,
  images,
  loading,
  hasMore,
  loadMore,
}) => {
  const [query, setQuery] = useState("");

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            onSearch(searchQuery);
          }
        }, 300);
      };
    })(),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);
    debouncedSearch(searchQuery);
  };

  // Re-search when selectedSources changes and there's an active search
  useEffect(() => {
    if (query.trim()) {
      onSearch(query);
    }
  }, [selectedSources, query]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="components-popover components-dropdown__content block-editor-inserter__popover is-quick is-positioned"
        style={{
          position: 'relative',
          opacity: 1,
          margin: 0,
          width: '550px',
          maxWidth: '90vw',
          boxShadow: '0 3px 30px rgba(25, 30, 35, 0.2)',
          borderRadius: '8px',
          border: '1px solid #ddd',
          backgroundColor: 'white',
          padding: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="block-editor-inserter__quick-inserter">
          {/* Search Input */}
          <div className="block-editor-inserter__search" style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Search for an image..."
              value={query}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#007cba'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearch(query);
                }
              }}
            />
          </div>

          {/* API Selection Buttons */}
          <div className="block-editor-inserter__block-list" style={{ marginBottom: '8px' }}>
            <div className="block-editor-block-types-list">
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('getty') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('getty')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Getty API</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('pexels') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('pexels')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Pexels</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('shutterstock') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('shutterstock')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Shutterstock API</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('unsplash') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('unsplash')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Unsplash</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('pixabay') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('pixabay')}
                onMouseEnter={(e) => {
                  if (!selectedSources.includes('pixabay')) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedSources.includes('pixabay')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Pixabay</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('flickr') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('flickr')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Flickr</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('nasa') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('nasa')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>NASA</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('rawpixel') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('rawpixel')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Rawpixel</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('inaturalist') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('inaturalist')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>iNaturalist</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('stocksnap') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('stocksnap')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>StockSnap.io</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('wikiCommons') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('wikiCommons')}
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
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Wiki Commons</div>
              </div>
              
              <div 
                className="block-editor-block-types-list__item" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  border: '1px solid transparent', 
                  borderRadius: '4px', 
                  marginBottom: '2px', 
                  transition: '0.2s',
                  backgroundColor: selectedSources.includes('internet') ? '#e3f2fd' : 'transparent'
                }}
                onClick={() => onSourceToggle('internet')}
                onMouseEnter={(e) => {
                  if (!selectedSources.includes('internet')) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedSources.includes('internet')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'rgb(30, 30, 30)' }}>Internet</div>
              </div>
            </div>
          </div>

          <div className="block-editor-inserter__block-list">
            {query && images.length > 0 ? (
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#1e1e1e', 
                  marginBottom: '12px',
                  padding: '8px 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {`Image Results for "${query}"`}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {images.map((image, index) => (
                    <div
                      key={`${image.url}-${index}`}
                      onClick={() => {
                        console.log('🖱️ [MODAL DEBUG] Image clicked:', image);
                        
                        // Track Unsplash download if applicable
                        if (image.source === 'unsplash' && image.downloadLocation) {
                          console.log('📸 [UNSPLASH TRACKING] Triggering download tracking for:', image.downloadLocation);
                          fetch('/api/unsplash-download', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              downloadLocation: image.downloadLocation
                            })
                          }).catch(error => {
                            console.error('❌ [UNSPLASH TRACKING] Failed to track download:', error);
                          });
                        }
                        
                        onSelect(image);
                      }}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
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
                          height: '160px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div style={{
                        padding: '4px 6px',
                        fontSize: '10px',
                        color: '#666',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {(image.source === 'unsplash' || image.source === 'pixabay' || image.source === 'flickr' || image.source === 'nasa' || image.source === 'rawpixel' || image.source === 'inaturalist' || image.source === 'stocksnap' || image.source === 'internet') && image.photographerUrl ? (
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
                    marginTop: '12px',
                    padding: '8px 0',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: loading ? '#f5f5f5' : '#007cba',
                        color: loading ? '#999' : 'white',
                        border: 'none',
                        borderWidth: '0',
                        borderStyle: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
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
            ) : loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#666'
              }}>
                Searching for images...
              </div>
            ) : query && images.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#666'
              }}>
                {`No images found for "${query}"`}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageSearchModal;