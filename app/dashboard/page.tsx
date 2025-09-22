'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArticleList } from '@/components/ArticleList';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { WordPressPost } from '@/types';
import { TuiPanel, TuiInfoPanel, TuiStatsPanel } from '@/components/TuiPanel';
import { TuiRadio } from '@/components/TuiFormElements';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, site, connect } = useWordPress();
  const [statusFilter, setStatusFilter] = useState('all');
  // Note: Site connection is now handled by useWordPress hook automatically

  // Redirect to site selection if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);


  const handleSelectArticle = (article: WordPressPost) => {
    router.push(`/editor/${article.id}`);
  };

  const handleCreateNew = () => {
    router.push('/generate');
  };

  if (authLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: '#c0c0c0',
        overflow: 'auto'
      }}>
        <div 
          className="tui-window" 
          style={{ 
            width: '100%',
            minHeight: '100vh',
            margin: 0
          }}
        >
          <fieldset className="tui-fieldset" style={{
            width: '100%',
            height: '100vh',
            margin: 0,
            padding: 0
          }}>
            <legend className="center">Loading Dashboard</legend>
            <div className="center" style={{ 
              minHeight: 'calc(100vh - var(--space-120))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                <div className="tui-progress" style={{ width: '50%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--space-18)' }}>Loading dashboard...</p>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }


  if (!isConnected || !site) {
    return (
      <div className="screen" style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c0c0c0',
        padding: 'var(--space-20)'
      }}>
        <div className="tui-window" style={{ width: 'var(--space-500)' }}>
          <fieldset className="tui-fieldset" style={{
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0
          }}>
            <legend className="center">No Site Selected</legend>
            <div className="center" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <h3>No site selected</h3>
              <p>Please select a site from the home page.</p>
              <button 
                className="tui-button"
                onClick={() => router.push('/')}
              >
                <span className="tui-shortcut">F1</span>Go to Home
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 9999,
      backgroundColor: '#c0c0c0',
      overflow: 'auto'
    }}>
      <div 
        id="articles-window"
        className="tui-window" 
        style={{ 
          width: '100%',
          minHeight: '100vh',
          margin: 0
        }}
      >
        <fieldset className="tui-fieldset" style={{
          width: '100%',
          height: '100vh',
          margin: 0,
          padding: '40px'
        }}>
          <legend className="center">Articles</legend>
          
          {/* Articles List */}
          <div style={{ 
            minHeight: 'calc(100vh - var(--space-120))',
            overflow: 'visible',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <ArticleList 
              onSelectArticle={handleSelectArticle}
              onCreateNew={handleCreateNew}
              onGenerateNew={() => router.push('/generate')}
              statusFilter={statusFilter}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="screen" style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c0c0c0',
        padding: 'var(--space-20)'
      }}>
        <div className="tui-window" style={{ width: 'var(--space-400)' }}>
          <fieldset className="tui-fieldset" style={{
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0
          }}>
            <legend className="center">Loading Dashboard</legend>
            <div className="center" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="tui-progress-bar">
                <div className="tui-progress" style={{ width: '50%' }}></div>
              </div>
              <p>Loading dashboard...</p>
            </div>
          </fieldset>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}