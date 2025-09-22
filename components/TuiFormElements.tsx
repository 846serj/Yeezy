'use client';

import React from 'react';

// Checkbox Component
interface TuiCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const TuiCheckbox: React.FC<TuiCheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`tui-checkbox-container ${className}`}>
      <input
        type="checkbox"
        id={id}
        className="tui-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label htmlFor={id} className="tui-checkbox-label">
        <span className="tui-checkbox-box">
          {checked && <span className="tui-checkbox-check">✓</span>}
        </span>
        <span className="tui-checkbox-text">{label}</span>
      </label>
    </div>
  );
};

// Radio Component
interface TuiRadioProps {
  id: string;
  name: string;
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const TuiRadio: React.FC<TuiRadioProps> = ({
  id,
  name,
  label,
  value,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`tui-radio-container ${className}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        className="tui-radio"
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label htmlFor={id} className="tui-radio-label">
        <span className="tui-radio-button">
          {checked && <span className="tui-radio-dot">●</span>}
        </span>
        <span className="tui-radio-text">{label}</span>
      </label>
    </div>
  );
};

// Textarea Component
interface TuiTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const TuiTextarea: React.FC<TuiTextareaProps> = ({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  cols = 50,
  disabled = false,
  className = '',
  label
}) => {
  return (
    <div className={`tui-textarea-container ${className}`}>
      {label && <label className="tui-textarea-label">{label}</label>}
      <textarea
        id={id}
        className="tui-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        disabled={disabled}
      />
    </div>
  );
};

// Select/Dropdown Component
interface TuiSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
}

export const TuiSelect: React.FC<TuiSelectProps> = ({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  label,
  placeholder
}) => {
  return (
    <div className={`tui-select-container ${className}`}>
      {label && <label className="tui-select-label">{label}</label>}
      <select
        id={id}
        className="tui-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
