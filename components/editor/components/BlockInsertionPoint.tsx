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
      icon: '📝'
    },
    {
      name: 'core/heading',
      title: 'Heading',
      description: 'Introduce new sections and organize content.',
      icon: '📋'
    },
    {
      name: 'core/image',
      title: 'Image',
      description: 'Insert an image to make a visual statement.',
      icon: '🖼️'
    },
    {
      name: 'core/list',
      title: 'List',
      description: 'Create a bulleted or numbered list.',
      icon: '📋'
    },
    {
      name: 'core/quote',
      title: 'Quote',
      description: 'Give quoted text visual emphasis.',
      icon: '💬'
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
             height: '2px',
             backgroundColor: '#007cba',
             margin: '8px 0'
           }} 
      />
      <div className="block-editor-block-list__insertion-point-inserter" 
           style={{ transform: 'none' }}>
        <div className="components-dropdown block-editor-inserter" tabIndex={-1}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={showInserter}
            className="components-button block-editor-inserter__toggle is-next-40px-default-size has-icon"
            aria-label="Add block"
            onClick={handleClick}
            style={{
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              fontSize: '13px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#005a87';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007cba';
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
                transform: 'translateX(-50%) translateY(8px)',
                opacity: 1,
                zIndex: 1000000,
                margin: 0,
                width: '650px',
                maxWidth: '90vw',
                boxShadow: '0 3px 30px rgba(25, 30, 35, 0.2)',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: 'white'
              }}
            >
              <div className="components-popover__content" style={{ 
                maxHeight: '473px', 
                overflow: 'auto',
                borderRadius: '8px'
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
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              padding: '8px 12px',
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
                    
                    <div className="block-editor-block-types-list">
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
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            borderRadius: '4px',
                            transition: 'all 0.15s ease',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            color: '#1e1e1e'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                            e.currentTarget.style.color = '#007cba';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#1e1e1e';
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                            e.currentTarget.style.color = '#007cba';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#1e1e1e';
                          }}
                        >
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '16px',
                            color: '#666'
                          }}>
                            {block.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              marginBottom: '2px',
                              fontSize: '13px',
                              lineHeight: '1.4'
                            }}>
                              {block.title}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              lineHeight: '1.4'
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
