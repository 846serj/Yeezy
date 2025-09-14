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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-[90vw] max-w-7xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Select Image</h3>

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

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query);
          }}
          className="mb-4 flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords"
            className="flex-1 border p-2 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

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

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => onSelect(img)}
              className="border p-3 rounded shadow cursor-pointer hover:bg-gray-100"
            >
              <img
                src={img.thumbnail ?? img.url}
                alt={img.caption}
                className="w-full h-48 object-cover mb-2 rounded"
                loading="lazy"
              />
              <p className="text-xs font-semibold mb-1">{img.caption}</p>
              {img.attribution && (
                <p className="text-xs text-gray-600 mb-1">{img.attribution}</p>
              )}
              {img.photographer && img.photographerUrl && (
                <a
                  href={img.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View photographer profile
                </a>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ImageSearchModal;
