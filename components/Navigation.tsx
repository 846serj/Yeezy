'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, site, disconnect } = useWordPress();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  // Don't show navigation on auth pages or site selection
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <nav style={{ 
      background: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6', 
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
          WordPress Article Editor
        </h2>
        {site && (
          <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
            Connected to: {site.url}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {pathname !== '/dashboard' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-outline btn-sm"
          >
            Dashboard
          </button>
        )}
        
        <button
          onClick={handleDisconnect}
          className="btn btn-outline btn-sm"
        >
          Switch Site
        </button>
        
        <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
          {user?.email}
        </span>
        
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
