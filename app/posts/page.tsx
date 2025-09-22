'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArticleList } from '@/components/ArticleList';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/contexts/AuthContext';
import { WordPressPost } from '@/types';

function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, site, connect } = useWordPress();
  const [statusFilter, setStatusFilter] = useState('all');

  // Redirect to site selection if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect to site selection if no site is connected
  useEffect(() => {
    if (isAuthenticated && !isConnected) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isConnected, router]);

  const handlePostClick = (post: WordPressPost) => {
    router.push(`/editor/${post.id}`);
  };

  const handleNewPost = () => {
    router.push('/editor');
  };

  const handleBackToSites = () => {
    router.push('/dashboard');
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: '#c0c0c0'
      }}>
        <div 
          className="tui-window tui-border-double" 
          style={{ 
            width: '100%',
            height: '100%',
            margin: 0
          }}
        >
          <fieldset className="tui-fieldset">
            <legend className="center">Loading</legend>
            <div className="center" style={{ 
              height: 'calc(100vh - var(--space-80))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                <div className="tui-progress" style={{ width: '50%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--space-18)' }}>Loading...</p>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!isConnected) {
    return null; // Will redirect
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backgroundColor: '#c0c0c0'
    }}>
      <div 
        id="posts-window"
        className="tui-window" 
        style={{ 
          width: '100%',
          height: '100%',
          margin: 0
        }}
      >
        <fieldset className="tui-fieldset" style={{
          width: '100%',
          height: '100vh',
          margin: 0,
          padding: '40px'
        }}>
          <legend className="center">Posts - {site?.site_name || 'WordPress Site'}</legend>
          
          {/* Back Button */}
          <button 
            className="tui-button"
            onClick={handleBackToSites}
            style={{ marginBottom: 'var(--space-20)' }}
          >
            ← Back to Sites
          </button>

          {/* Posts List */}
          <div style={{ 
            height: 'calc(100vh - var(--space-120))',
            overflow: 'auto'
          }}>
            <ArticleList
              onSelectArticle={handlePostClick}
              onCreateNew={handleNewPost}
              onGenerateNew={() => router.push('/generate')}
              statusFilter={statusFilter}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export default function Posts() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: '#c0c0c0'
      }}>
        <div className="tui-window">
          <fieldset className="tui-fieldset">
            <legend className="center">Loading</legend>
            <div className="center" style={{ padding: 'var(--space-40)' }}>
              <p>Loading posts...</p>
            </div>
          </fieldset>
        </div>
      </div>
    }>
      <PostsContent />
    </Suspense>
  );
}