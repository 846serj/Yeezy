import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(({
  label,
  error,
  success,
  hint,
  required = false,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  
  const hasError = !!error || variant === 'error';
  const hasSuccess = !!success || variant === 'success';

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
  };

  const labelStyles = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: hasError ? '#dc3545' : '#333',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  };

  const inputContainerStyles = {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles = {
    width: '100%',
    padding: leftIcon ? 'var(--space-3) var(--space-3) var(--space-3) 2.5rem' : rightIcon ? 'var(--space-3) 2.5rem var(--space-3) var(--space-3)' : 'var(--space-3)',
    border: `1px solid ${hasError ? 'var(--tui-danger)' : hasSuccess ? 'var(--tui-success)' : 'transparent'}`,
    borderRadius: 'var(--radius-base)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-primary)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: props.disabled ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
    color: props.disabled ? 'var(--tui-secondary)' : 'inherit',
  };

  const iconStyles = {
    position: 'absolute' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--space-20)',
    height: 'var(--space-20)',
    color: hasError ? '#dc3545' : hasSuccess ? '#28a745' : '#6c757d',
    pointerEvents: 'none' as const,
  };

  const leftIconStyles = {
    ...iconStyles,
    left: 'var(--space-3)',
  };

  const rightIconStyles = {
    ...iconStyles,
    right: 'var(--space-3)',
  };

  const hintStyles = {
    fontSize: 'var(--space-3)',
    color: '#6c757d',
    marginTop: 'var(--space-1)',
  };

  const errorStyles = {
    fontSize: 'var(--space-3)',
    color: '#dc3545',
    marginTop: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  };

  const successStyles = {
    fontSize: 'var(--space-3)',
    color: '#28a745',
    marginTop: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = hasError ? 'var(--tui-danger)' : hasSuccess ? 'var(--tui-success)' : 'var(--tui-primary)';
    e.currentTarget.style.boxShadow = `0 0 0 2px ${hasError ? 'rgba(168, 0, 0, 0.1)' : hasSuccess ? 'rgba(0, 168, 0, 0.1)' : 'rgba(0, 0, 168, 0.1)'}`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = hasError ? 'var(--tui-danger)' : hasSuccess ? 'var(--tui-success)' : 'transparent';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyles} className={className}>
      <label 
        htmlFor={inputId}
        style={labelStyles}
      >
        {label}
        {required && (
          <span style={{ color: '#dc3545' }} aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div style={inputContainerStyles}>
        {leftIcon && (
          <div style={leftIconStyles}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={hasError}
          aria-describedby={[
            hint ? hintId : '',
            hasError ? errorId : '',
          ].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        
        {rightIcon && (
          <div style={rightIconStyles}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {hint && (
        <div id={hintId} style={hintStyles}>
          {hint}
        </div>
      )}
      
      {hasError && (
        <div id={errorId} style={errorStyles} role="alert">
          <AlertCircle style={{ width: 'var(--space-14)', height: 'var(--space-14)' }} />
          {error}
        </div>
      )}
      
      {hasSuccess && !hasError && (
        <div style={successStyles}>
          <CheckCircle style={{ width: 'var(--space-14)', height: 'var(--space-14)' }} />
          {success}
        </div>
      )}
    </div>
  );
});
