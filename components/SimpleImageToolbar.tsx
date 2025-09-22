import React from 'react';
import { createPortal } from 'react-dom';

interface SimpleImageToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete?: () => void;
  onReplace?: () => void;
}

const SimpleImageToolbar: React.FC<SimpleImageToolbarProps> = ({ isVisible, position, onClose, onDelete, onReplace }) => {
  if (!isVisible) return null;

  return createPortal(
    <div
      className="image-toolbar-overlay"
      style={{
        position: 'fixed',
        top: position.y - 60, // Position var(--space-60) above the image
        left: position.x - 150, // Center the toolbar (var(--space-300) width / 2)
        zIndex: 1000000,
        pointerEvents: 'auto',
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform'
      }}
    >
      <div>
        <button className="tui-button" title="Align">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M19 5.5H5V4h14v1.5ZM19 20H5v-1.5h14V20ZM5 9h14v6H5V9Z" />
          </svg>
        </button>
        <button 
          className="tui-button" 
          title="Replace"
          onClick={onReplace}
        >
          Replace
        </button>
        <button className="tui-button" title="Crop">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z"/>
          </svg>
        </button>
        <button className="tui-button" title="Options">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z"/>
          </svg>
        </button>
        <button 
          className="tui-button" 
          title="Delete Image"
          onClick={onDelete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zm4 12H8v-9h2zm6 0h-2v-9h2zm.618-15L15 2H9L7.382 4H3v2h18V4z"/>
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default SimpleImageToolbar;
