"use client";

import React, { useState, useRef, useEffect } from 'react';

interface BlockInsertionPointProps {
  index: number;
  onInsertBlock: (blockType: string, attributes?: Record<string, any>, index?: number) => void;
  isVisible: boolean;
}

export const BlockInsertionPoint: React.FC<BlockInsertionPointProps> = ({
  index,
  onInsertBlock,
  isVisible
}) => {
  const [showInserter, setShowInserter] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  const handleClick = () => {
    setShowInserter(true);
  };

  const handleInsertBlock = (blockType: string, attributes: Record<string, any> = {}) => {
    onInsertBlock(blockType, attributes, index);
    setShowInserter(false);
  };

  const handleClose = () => {
    setShowInserter(false);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowInserter(false);
      }
    };

    if (showInserter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInserter]);

  if (!isVisible) return null;

  return (
    <div className="block-editor-block-list__insertion-point is-vertical is-with-inserter">
      <div className="block-editor-block-list__insertion-point-indicator" 
           style={{ 
             opacity: showInserter ? 1 : 0.3,
             transform: 'none',
             height: 'var(--space-2)',
             backgroundColor: '#007cba',
             margin: 'var(--space-8) 0'
           }} 
      />
      <div className="block-editor-block-list__insertion-point-inserter" 
           style={{ transform: 'none' }}>
        <div className="components-dropdown block-editor-inserter" tabIndex={-1}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={showInserter}
            className="components-button block-editor-inserter__toggle is-next-var(--space-40)-default-size has-icon"
            aria-label="Add block"
            onClick={handleClick}
            style={{
              backgroundColor: '#00a800',
              color: 'white',
              border: 'none',
              borderRadius: '0',
              width: 'var(--space-40)',
              height: 'var(--space-40)',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 var(--space-2) var(--space-8) rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              fontSize: 'var(--space-13)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#008000';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00a800';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" fill="currentColor"></path>
            </svg>
          </button>
          
          {/* Block Inserter Popover */}
          {showInserter && (
            <div
              ref={popoverRef}
              className="components-popover components-dropdown__content block-editor-inserter__popover is-quick is-positioned"
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(var(--space-8))',
                opacity: 1,
                zIndex: 1000000,
                margin: 0,
                width: '550px',
                maxWidth: '90vw',
                boxShadow: '0 var(--space-3) var(--space-30) rgba(25, 30, 35, 0.2)',
                borderRadius: 'var(--space-8)',
                border: 'var(--space-1) solid #ddd',
                backgroundColor: 'white'
              }}
            >
              <div className="components-popover__content" style={{ 
                maxHeight: 'var(--space-473)', 
                overflow: 'auto',
                borderRadius: 'var(--space-8)'
              }}>
                <div className="block-editor-inserter__quick-inserter has-search has-expand">
                  {/* Search Control */}
                  <div className="components-base-control components-input-control components-search-control block-editor-inserter__search">
                    <div className="components-base-control__field">
                      <div className="components-flex components-input-base">
                        <label className="components-visually-hidden" htmlFor="components-search-control">
                          Search
                        </label>
                        <div className="components-input-control__container">
                          <input
                            id="components-search-control"
                            className="components-input-control__input"
                            type="search"
                            placeholder="Search for a block"
                            style={{
                              border: 'var(--space-1) solid #ddd',
                              borderRadius: 'var(--space-4)',
                              fontSize: 'var(--space-13)',
                              lineHeight: '1.4',
                              padding: 'var(--space-8) var(--space-12)',
                              width: '100%',
                              background: 'white',
                              color: '#1e1e1e'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block Types List */}
                  <div className="block-editor-inserter__block-list">
                    <div className="block-editor-inserter__panel-header">
                      <h2 className="block-editor-inserter__panel-title">
                        <div className="components-visually-hidden">Blocks</div>
                      </h2>
                    </div>
                    
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
                          onClick={() => handleInsertBlock(block.name, { content: `New ${block.title.toLowerCase()} block` })}
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
