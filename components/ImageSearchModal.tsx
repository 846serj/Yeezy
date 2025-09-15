"use client";

import React, { FC, useState } from "react";

const sourceLabels: Record<string, string> = {
  all:         "All",
  unsplash:    "Unsplash",
  pexels:      "Pexels",
  wikiCommons: "Wiki Commons",
  wpMedia:     "WordPress Media",
};

export interface ImageResult {
  url:        string;
  full:       string;
  caption:    string;
  source:     string;
  thumbnail?: string;
  videoId?:   string;
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

  console.log('🔍 ImageSearchModal render:', { isOpen, imagesCount: images.length });

  // Note: Auto-search is now handled by the parent component

  if (!isOpen) {
    console.log('🔍 ImageSearchModal not open, returning null');
    return null;
  }

  console.log('🔍 ImageSearchModal is open, rendering modal');

  return (
    <div
      className="components-popover block-editor-inserter__popover"
      style={{
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000000,
        width: '900px',
        maxWidth: '90vw',
        boxShadow: '0 3px 30px rgba(25, 30, 35, 0.2)',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0'
      }}
    >
      <div className="components-popover__content" style={{ 
        maxHeight: '600px', 
        overflow: 'auto',
        borderRadius: '8px'
      }}>
        <div className="block-editor-inserter__quick-inserter has-search has-expand">
          <div className="block-editor-inserter__panel-header">
            <div className="flex justify-between items-center mb-4">
              <h2 className="block-editor-inserter__panel-title text-lg font-semibold">Select Featured Image</h2>
              <button
                onClick={onClose}
                className="components-button is-tertiary"
                style={{
                  padding: '4px 8px',
                  fontSize: '14px',
                  color: '#666',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          </div>

        {/* Sources - Hidden old checkbox interface */}
        <div className="hidden grid-cols-5 gap-2 mb-4">
          {Object.entries(sourceLabels).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedSources.includes(key)}
                onChange={() => onSourceToggle(key)}
                className="mr-2 accent-indigo-600"
              />
              {label}
            </label>
          ))}
        </div>

          <div className="block-editor-inserter__panel-content">
            {/* Search */}
            <div className="components-base-control components-input-control components-search-control block-editor-inserter__search">
              <div className="components-base-control__field">
                <div className="components-input-control__container">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for images..."
                    className="components-input-control__input"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSearch(query);
                      }
                    }}
                  />
                  <button
                    onClick={() => onSearch(query)}
                    disabled={loading}
                    className="components-button is-primary"
                    style={{
                      marginLeft: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      backgroundColor: '#0073aa',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? "Searching…" : "Search"}
                  </button>
                </div>
              </div>
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
          </div>
        </div>

            {/* Images Grid */}
            <div className="block-editor-inserter__block-list" style={{ marginTop: '16px' }}>
              <div className="block-editor-block-types-list" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px'
              }}>
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="block-editor-block-types-list__list-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      minHeight: '100px',
                      gap: '8px',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0073aa';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 115, 170, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => onSelect(img)}
                  >
                    <div style={{ width: '100%', height: '120px', overflow: 'hidden', borderRadius: '4px' }}>
                      <img
                        src={img.thumbnail || img.url}
                        alt={img.caption || "Image"}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      lineHeight: '1.3',
                      maxHeight: '32px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {img.caption || img.title || "No caption"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {hasMore && (
              <div className="text-center mb-4" style={{ padding: '0 16px' }}>
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="components-button is-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#f0f0f1',
                    color: '#1e1e1e',
                    border: '1px solid #c3c4c7',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSearchModal;
