'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ClientOnlyGutenbergEditor } from '@/components/editor';
import SmartGutenbergEditor from '@/components/editor/SmartGutenbergEditor';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { WordPressPost, EditorContent } from '@/types';

export default function EditArticle() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;
  
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, getPost, updatePost, createPost, uploadMedia, updateMedia } = useWordPress();
  const [useSmartEditor, setUseSmartEditor] = useState(true);
  const [article, setArticle] = useState<WordPressPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to site selection if not connected
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && isAuthenticated && !isConnected) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isConnected, router]);

  // Load article data
  useEffect(() => {
    const loadArticle = async () => {
      if (!isConnected || !articleId) return;
      
      try {
        setLoading(true);
        setError(null);
        const articleData = await getPost(parseInt(articleId));
        setArticle(articleData);
      } catch (err) {
        console.error('Failed to load article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [isConnected, articleId, getPost]);

  const handleSave = async (post: EditorContent) => {
    try {
      console.log('💾 WordPress Gutenberg content saved:', post);
      console.log('📝 Title type:', typeof post.title);
      console.log('📝 Title value:', post.title);

      if (article) {
        // Update existing post
        const updatedPost = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status,
          featured_media: post.featured_media,
          categories: post.categories,
          tags: post.tags
        };
        await updatePost(article.id, updatedPost);
        console.log('✅ Post updated successfully');
      }
      
      // Redirect to dashboard after successful save
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Error saving post:', error);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  // Show loading while checking authentication or loading article
  if (authLoading || loading) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>{loading ? 'Loading article...' : 'Loading...'}</div>
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

  // Show error if article failed to load
  if (error) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading if article not loaded yet
  if (!article) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>Loading article...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <main className="main-content">
        <div className="container">
          {/* Editor Type Toggle */}
          <div style={{ padding: '1rem', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={useSmartEditor}
                onChange={(e) => setUseSmartEditor(e.target.checked)}
              />
              Use Smart Editor (WordPress Official + Custom Fallback)
            </label>
          </div>
          
          {typeof window !== 'undefined' && (
            <>
              {window.wordPressUpload = uploadMedia}
              {window.wordPressUpdateMedia = updateMedia}
            </>
          )}
          {useSmartEditor ? (
            <SmartGutenbergEditor
              post={{
                title: article.title.rendered,
                content: article.content.rendered,
                excerpt: article.excerpt.rendered,
                status: article.status as 'publish' | 'draft' | 'private' | 'pending',
                featured_media: article.featured_media,
                categories: article.categories || [],
                tags: article.tags || [],
                _embedded: (article as any)._embedded // Include embedded data for featured image
              }}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <ClientOnlyGutenbergEditor
              post={{
                title: article.title.rendered,
                content: article.content.rendered,
                excerpt: article.excerpt.rendered,
                status: article.status as 'publish' | 'draft' | 'private' | 'pending',
                featured_media: article.featured_media,
                categories: article.categories || [],
                tags: article.tags || []
              }}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      </main>
    </div>
  );
}
