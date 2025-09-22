'use client';

import React, { useEffect } from 'react';

interface TuiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const TuiModal: React.FC<TuiModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  className = ''
}) => {
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

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'tui-modal-small';
      case 'large':
        return 'tui-modal-large';
      default:
        return 'tui-modal-medium';
    }
  };

  return (
    <div className="tui-modal-overlay" onClick={onClose}>
      <div 
        className={`tui-modal ${getSizeClass()} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tui-window tui-border-double">
          <fieldset className="tui-fieldset tui-border-solid">
            <legend className="center">{title}</legend>
            <button 
              className="tui-fieldset-button right"
              onClick={onClose}
              style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)' }}
            >
              <span className="red-255-text">×</span>
            </button>
            <div className="tui-modal-content">
              {children}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};

interface TuiConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

export const TuiConfirmModal: React.FC<TuiConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'tui-button',
  cancelButtonClass = 'tui-button'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <TuiModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div style={{ padding: 'var(--space-20)', textAlign: 'center' }}>
        <p style={{ marginBottom: 'var(--space-20)' }}>{message}</p>
        <div style={{ display: 'flex', gap: 'var(--space-10)', justifyContent: 'center' }}>
          <button 
            className={cancelButtonClass}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={confirmButtonClass}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </TuiModal>
  );
};
