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
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(8px)',
        opacity: 1,
        zIndex: 1000000,
        margin: 0,
        width: '900px',
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
              <div className="block-editor-block-types-list" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '16px'
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
                      padding: '16px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px',
                      transition: 'all 0.15s ease',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      color: '#1e1e1e',
                      minHeight: '100px'
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
                    <span className="block-editor-block-types-list__item-icon" style={{
                      width: '32px',
                      height: '32px',
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
                      gap: '4px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        fontWeight: '500', 
                        fontSize: '13px',
                        lineHeight: '1.4',
                        textAlign: 'center'
                      }}>
                        {block.title}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
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
    </div>
  );
};
