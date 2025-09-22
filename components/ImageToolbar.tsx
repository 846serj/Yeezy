import React from 'react';

interface ImageToolbarProps {
  position: {
    blockId: string;
    x: number;
    y: number;
    popupX: number;
    popupY: number;
  };
  isVisible: boolean;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({ position, isVisible }) => {
  
  
  if (!isVisible) {
    
    return null;
  }
  
  

  return (
    <div
      className="components-popover block-editor-block-popover"
      style={{
        position: 'fixed',
        top: position.popupY,
        left: position.popupX,
        transform: 'translateZ(var(--space-0))',
        pointerEvents: 'auto',
        zIndex: 1000000,
        width: 'var(--space-300)',
        maxWidth: '90vw',
        boxShadow: '0 var(--space-3) var(--space-30) rgba(25, 30, 35, 0.2)',
        borderRadius: 'var(--space-8)',
        border: 'var(--space-1) solid #ddd',
        backgroundColor: 'white',
        padding: 'var(--space-8)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
      }}
    >
      <div className="components-popover__content">
        <div 
          role="toolbar" 
          aria-orientation="horizontal" 
          aria-label="Image tools" 
          className="components-accessible-toolbar"
        >
          <div className="block-editor-block-toolbar">
            <div className="components-toolbar-group">
              {/* Placeholder buttons */}
              <button 
                type="button"
                className="components-button has-icon"
                aria-label="Align"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M19 5.5H5V4h14v1.5ZM19 20H5v-1.5h14V20ZM5 9h14v6H5V9Z" />
                </svg>
              </button>
              <button 
                type="button"
                className="components-button has-icon"
                aria-label="Replace"
              >
                Replace
              </button>
              <button 
                type="button"
                className="components-button has-icon"
                aria-label="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToolbar;
