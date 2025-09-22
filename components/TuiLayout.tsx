'use client';

import React from 'react';

interface TuiLayoutProps {
  children: React.ReactNode;
}

export function TuiLayout({ 
  children
}: TuiLayoutProps) {
  return (
    <div className="screen" style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#c0c0c0',
      padding: 'var(--space-20)'
    }}>
      {children}
    </div>
  );
}
