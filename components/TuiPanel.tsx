'use client';

import React from 'react';

interface TuiPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  borderStyle?: 'solid' | 'double' | 'dashed';
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export const TuiPanel: React.FC<TuiPanelProps> = ({
  title,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  borderStyle = 'solid',
  headerActions,
  footer
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapsed = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const getBorderClass = () => {
    switch (borderStyle) {
      case 'double':
        return 'tui-border-double';
      case 'dashed':
        return 'tui-border-dashed';
      default:
        return 'tui-border-solid';
    }
  };

  return (
    <div className={`tui-panel ${className}`}>
      <div className={`tui-window ${getBorderClass()}`}>
        <fieldset className="tui-fieldset">
          {title && (
            <legend className="center" onClick={collapsible ? toggleCollapsed : undefined} style={{ cursor: collapsible ? 'pointer' : 'default' }}>
              {collapsible && (
                <span className="tui-panel-toggle">
                  {isCollapsed ? '▶' : '▼'}
                </span>
              )}
              {title}
            </legend>
          )}
          
          {headerActions && (
            <div className="tui-panel-header-actions">
              {headerActions}
            </div>
          )}

          {!isCollapsed && (
            <div className="tui-panel-content">
              {children}
            </div>
          )}

          {footer && !isCollapsed && (
            <div className="tui-panel-footer">
              {footer}
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
};

// Info Panel Component
interface TuiInfoPanelProps {
  title: string;
  items: { label: string; value: string | React.ReactNode }[];
  className?: string;
}

export const TuiInfoPanel: React.FC<TuiInfoPanelProps> = ({
  title,
  items,
  className = ''
}) => {
  return (
    <TuiPanel title={title} className={className} borderStyle="double">
      <div style={{ padding: 'var(--space-10)' }}>
        {items.map((item, index) => (
          <div key={index} style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>{item.label}:</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </TuiPanel>
  );
};

// Action Panel Component
interface TuiActionPanelProps {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}

export const TuiActionPanel: React.FC<TuiActionPanelProps> = ({
  title,
  children,
  actions,
  className = ''
}) => {
  return (
    <TuiPanel 
      title={title} 
      className={className}
      borderStyle="solid"
      footer={
        <div className="tui-panel-actions" style={{ padding: 'var(--space-10)', borderTop: 'var(--space-1) solid #000' }}>
          {actions}
        </div>
      }
    >
      {children}
    </TuiPanel>
  );
};

// Stats Panel Component
interface TuiStatsPanelProps {
  title: string;
  stats: { label: string; value: number; color?: string }[];
  className?: string;
}

export const TuiStatsPanel: React.FC<TuiStatsPanelProps> = ({
  title,
  stats,
  className = ''
}) => {
  return (
    <TuiPanel title={title} className={className} borderStyle="dashed">
      <div style={{ padding: 'var(--space-10)' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span>{stat.label}</span>
              <span style={{ color: stat.color || '#000' }}>{stat.value}</span>
            </div>
            <div className="tui-progress-bar">
              <div 
                className="tui-progress" 
                style={{ 
                  width: `${Math.min((stat.value / 100) * 100, 100)}%`,
                  backgroundColor: stat.color || '#000'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </TuiPanel>
  );
};
