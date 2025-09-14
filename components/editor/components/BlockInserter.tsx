import React from 'react';

interface BlockInserterProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (blockType: string, attributes?: Record<string, any>) => void;
}

export const BlockInserter: React.FC<BlockInserterProps> = ({ 
  isOpen, 
  onClose, 
  onAddBlock 
}) => {
  if (!isOpen) return null;

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

  const handleAddBlock = (blockType: string, attributes: Record<string, any> = {}) => {
    onAddBlock(blockType, attributes);
    onClose();
  };

  return (
    <div
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
                    autoComplete="off"
                    placeholder="Search"
                    className="components-input-control__input"
                    id="components-search-control"
                    type="search"
                    value=""
                    readOnly
                  />
                  <span className="components-input-control__suffix">
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                        <path d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z"></path>
                      </svg>
                    </div>
                  </span>
                  <div aria-hidden="true" className="components-input-control__backdrop"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Block Types List */}
          <div className="block-editor-inserter__quick-inserter-results">
            <div className="block-editor-inserter__panel-header">
              <h2 className="block-editor-inserter__panel-title">
                <div className="components-visually-hidden">Blocks</div>
              </h2>
            </div>
            
            <div className="block-editor-inserter__block-list">
              <div className="block-editor-block-types-list">
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
    </div>
  );
};
