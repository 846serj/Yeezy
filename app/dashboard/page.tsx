'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArticleList } from '@/components/ArticleList';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { WordPressPost } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, site } = useWordPress();
  const [statusFilter, setStatusFilter] = useState('all');

  // Redirect to site selection if not connected
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && isAuthenticated && !isConnected) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isConnected, router]);

  const handleSelectArticle = (article: WordPressPost) => {
    router.push(`/editor/${article.id}`);
  };

  const handleCreateNew = () => {
    router.push('/editor');
  };

  const handleGenerateNew = () => {
    router.push('/generate');
  };

  const handleBackToSites = () => {
    router.push('/');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>Loading...</div>
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
    <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
      <main className="view__inner">
        <div className="maxWidth maxWidth--content hSpace hSpace--content">
          <div className="editor-card">
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Articles - {site?.url}</h2>
              <button
                onClick={handleBackToSites}
                className="btn btn-secondary btn-sm"
                style={{ marginRight: '1rem' }}
              >
                Switch Site
              </button>
            </div>
            <ArticleList
              onSelectArticle={handleSelectArticle}
              onCreateNew={handleCreateNew}
              onGenerateNew={handleGenerateNew}
              statusFilter={statusFilter}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
