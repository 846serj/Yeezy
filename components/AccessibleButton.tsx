import React from 'react';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    borderWidth: 'var(--space-1)',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 'var(--space-4)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const sizeStyles = {
    sm: {
      padding: 'var(--space-1) var(--space-3)',
      fontSize: '0.875rem',
      minHeight: 'var(--space-32)',
    },
    md: {
      padding: 'var(--space-2) var(--space-4)',
      fontSize: '0.875rem',
      minHeight: 'var(--space-40)',
    },
    lg: {
      padding: 'var(--space-3) var(--space-6)',
      fontSize: 'var(--space-4)',
      minHeight: 'var(--space-48)',
    },
  };

  const variantStyles = {
    primary: {
      background: '#0073aa',
      color: '#fff',
      borderColor: '#0073aa',
    },
    secondary: {
      background: '#fff',
      color: '#333',
      borderColor: '#ddd',
    },
    danger: {
      background: '#dc3545',
      color: '#fff',
      borderColor: '#dc3545',
    },
    ghost: {
      background: 'transparent',
      color: '#333',
      borderColor: 'transparent',
    },
  };

  const disabledStyles = {
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  const hoverStyles = {
    primary: {
      background: '#005177',
      borderColor: '#005177',
    },
    secondary: {
      background: '#f8f9fa',
      borderColor: '#ccc',
    },
    danger: {
      background: '#c82333',
      borderColor: '#c82333',
    },
    ghost: {
      background: '#f8f9fa',
    },
  };

  const focusStyles = {
    boxShadow: '0 0 0 var(--space-2) rgba(0, 115, 170, 0.25)',
  };

  const buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(disabled || loading ? disabledStyles : {}),
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, hoverStyles[variant]);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, variantStyles[variant]);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = focusStyles.boxShadow;
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={className}
      style={buttonStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading && (
        <Loader2 
          className="animate-spin" 
          style={{ 
            width: size === 'sm' ? 'var(--space-14)' : size === 'lg' ? 'var(--space-18)' : 'var(--space-16)',
            height: size === 'sm' ? 'var(--space-14)' : size === 'lg' ? 'var(--space-18)' : 'var(--space-16)'
          }} 
        />
      )}
      {!loading && leftIcon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      )}
    </button>
  );
};
