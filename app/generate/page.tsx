'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArticleGenerator } from '@/components/ArticleGenerator';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/contexts/AuthContext';
import { WordPressPost } from '@/types';

export default function Generate() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected } = useWordPress();

  // Redirect to site selection if not connected
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && isAuthenticated && !isConnected) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isConnected, router]);

  const handleBack = () => {
    router.push('/posts');
  };

  const handleArticleGenerated = (content: string, title: string, sources: string[]) => {
    try {
      
      
      // Store generated content in localStorage to avoid URL encoding issues
      const generatedData = {
        title,
        content,
        sources,
        timestamp: Date.now()
      };
      
      localStorage.setItem('generatedArticle', JSON.stringify(generatedData));
      
      
      // Redirect to editor
      router.push('/editor?generated=true');
    } catch (error) {
      console.error('❌ Error handling generated article:', error);
      // Fallback to URL params if localStorage fails
      router.push(`/editor?generated=true&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`);
    }
  };

  // Show loading while checking authentication
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
            <legend className="center">Loading Generator</legend>
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
              <div style={{ fontSize: 'var(--space-18)' }}>Loading Generator...</div>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Show site selection if not connected
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
          <legend className="center">Article Generator</legend>
          <div style={{ 
            padding: 'var(--space-20) var(--space-20) var(--space-20) var(--space-20)',
            minHeight: 'calc(100vh - var(--space-120))',
            overflow: 'visible',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <ArticleGenerator
              onBack={handleBack}
              onArticleGenerated={handleArticleGenerated}
            />
          </div>
        </fieldset>
      </div>
    </div>
  );
}
