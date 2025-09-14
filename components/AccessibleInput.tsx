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
    gap: '0.25rem',
  };

  const labelStyles = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: hasError ? '#dc3545' : '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const inputContainerStyles = {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles = {
    width: '100%',
    padding: leftIcon ? '0.75rem 0.75rem 0.75rem 2.5rem' : rightIcon ? '0.75rem 2.5rem 0.75rem 0.75rem' : '0.75rem',
    border: `1px solid ${hasError ? '#dc3545' : hasSuccess ? '#28a745' : '#ddd'}`,
    borderRadius: '4px',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: props.disabled ? '#f8f9fa' : '#fff',
    color: props.disabled ? '#6c757d' : '#333',
  };

  const iconStyles = {
    position: 'absolute' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    color: hasError ? '#dc3545' : hasSuccess ? '#28a745' : '#6c757d',
    pointerEvents: 'none' as const,
  };

  const leftIconStyles = {
    ...iconStyles,
    left: '0.75rem',
  };

  const rightIconStyles = {
    ...iconStyles,
    right: '0.75rem',
  };

  const hintStyles = {
    fontSize: '0.75rem',
    color: '#6c757d',
    marginTop: '0.25rem',
  };

  const errorStyles = {
    fontSize: '0.75rem',
    color: '#dc3545',
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const successStyles = {
    fontSize: '0.75rem',
    color: '#28a745',
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = hasError ? '#dc3545' : hasSuccess ? '#28a745' : '#0073aa';
    e.currentTarget.style.boxShadow = `0 0 0 2px ${hasError ? 'rgba(220, 53, 69, 0.25)' : hasSuccess ? 'rgba(40, 167, 69, 0.25)' : 'rgba(0, 115, 170, 0.25)'}`;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = hasError ? '#dc3545' : hasSuccess ? '#28a745' : '#ddd';
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
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          {error}
        </div>
      )}
      
      {hasSuccess && !hasError && (
        <div style={successStyles}>
          <CheckCircle style={{ width: '14px', height: '14px' }} />
          {success}
        </div>
      )}
    </div>
  );
});
