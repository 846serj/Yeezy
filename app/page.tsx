'use client';

import React, { useState } from 'react';
import { SiteSelector } from '@/components/SiteSelector';
import { SiteList } from '@/components/SiteList';
import { ArticleList } from '@/components/ArticleList';
import { ClientOnlyGutenbergEditor } from '@/components/editor';
import SmartGutenbergEditor from '@/components/editor/SmartGutenbergEditor';
import { AuthForm } from '@/components/AuthForm';
import { WordPressPost, EditorContent } from '@/types';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { Plus } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, connect, getPosts, site, disconnect, updatePost, createPost, uploadMedia, updateMedia } = useWordPress();
  const [currentView, setCurrentView] = useState<'sites' | 'add-site' | 'list' | 'editor'>('sites');
  const [selectedArticle, setSelectedArticle] = useState<WordPressPost | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [useSmartEditor, setUseSmartEditor] = useState(true);

  const handleConnect = async (siteUrl: string, username: string, appPassword: string) => {
    const success = await connect(siteUrl, username, appPassword);
    if (success) {
      setCurrentView('list');
    }
    return success;
  };

  const handleAddNewSite = () => {
    setCurrentView('sites');
  };

  const handleSelectArticle = (article: WordPressPost) => {
    setSelectedArticle(article);
    setCurrentView('editor');
  };

  const handleCreateNew = () => {
    setSelectedArticle(null);
    setCurrentView('editor');
  };

  const handleSave = (article: WordPressPost) => {
    setSelectedArticle(article);
    // Optionally switch back to list view
    // setCurrentView('list');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedArticle(null);
  };

  const handleBackToSiteSelector = () => {
    disconnect(); // Disconnect from current WordPress site
    setCurrentView('sites');
  };

  const handlePreview = (article: WordPressPost) => {
    window.open(article.link, '_blank');
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
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  // Show site list if not connected to WordPress
  if (!isConnected) {
    if (currentView === 'add-site') {
      return <SiteSelector onConnect={handleConnect} onBack={() => setCurrentView('sites')} />;
    }
    
    // Show site list with main page structure
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">

        <main className="view__inner">
          <div className="maxWidth maxWidth--content hSpace hSpace--content">
            <div className="editor-card">
              <SiteList onConnect={handleConnect} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      {/* <header className="header">
        <div className="container">
          <div className="flex-between">
            <h1 className="text-2xl font-bold">Yeez</h1>
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                  <button
                    onClick={() => {
                      // Handle logout
                      window.location.href = '/api/auth/logout';
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <AuthForm onSuccess={() => {}} />
              )}
            </div>
          </div>
        </div>
      </header> */}

      <main className="main-content">
        <div className="container">
          {authLoading && (
            <div className="flex-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {!authLoading && !isAuthenticated && (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Please sign in to continue</h2>
              <AuthForm onSuccess={() => {}} />
            </div>
          )}

          {!authLoading && isAuthenticated && (
            <>
              {currentView === 'sites' && (
                <div className="editor-card">
                  <SiteSelector onConnect={handleConnect} />
                </div>
              )}

              {currentView === 'add-site' && (
                <div className="editor-card">
                  <SiteList onConnect={handleConnect} />
                </div>
              )}

              {currentView === 'list' && (
                <div className="editor-card">
                  <ArticleList
                    onSelectArticle={handleSelectArticle}
                    onCreateNew={handleCreateNew}
                    statusFilter={statusFilter}
                  />
                </div>
              )}

              {currentView === 'editor' && (
                <>
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
                      post={selectedArticle ? {
                        title: selectedArticle.title.rendered,
                        content: selectedArticle.content.rendered,
                        excerpt: selectedArticle.excerpt.rendered,
                        status: selectedArticle.status as 'publish' | 'draft' | 'private' | 'pending',
                        featured_media: selectedArticle.featured_media,
                        categories: selectedArticle.categories || [],
                        tags: selectedArticle.tags || [],
                        _embedded: (selectedArticle as any)._embedded // Include embedded data for featured image
                      } : null}
                      onSave={async (post: EditorContent) => {
                        try {
                          console.log('💾 WordPress Gutenberg content saved:', post);
                          console.log('📝 Title type:', typeof post.title);
                          console.log('📝 Title value:', post.title);

                          if (selectedArticle) {
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
                            await updatePost(selectedArticle.id, updatedPost);
                            console.log('✅ Post updated successfully');
                          } else {
                            // Create new post
                            const newPost = {
                              title: post.title,
                              content: post.content,
                              excerpt: post.excerpt,
                              status: post.status,
                              featured_media: post.featured_media,
                              categories: post.categories,
                              tags: post.tags
                            };
                            await createPost(newPost);
                            console.log('✅ New post created successfully');
                          }
                        } catch (error) {
                          console.error('❌ Error saving post:', error);
                        }
                      }}
                      onCancel={() => setCurrentView('list')}
                    />
                  ) : (
                    <ClientOnlyGutenbergEditor
                      post={selectedArticle ? {
                        title: selectedArticle.title.rendered,
                        content: selectedArticle.content.rendered,
                        excerpt: selectedArticle.excerpt.rendered,
                        status: selectedArticle.status as 'publish' | 'draft' | 'private' | 'pending',
                        featured_media: selectedArticle.featured_media,
                        categories: selectedArticle.categories || [],
                        tags: selectedArticle.tags || []
                      } : null}
                      onSave={async (post: EditorContent) => {
                        try {
                          console.log('💾 WordPress Gutenberg content saved:', post);
                          console.log('📝 Title type:', typeof post.title);
                          console.log('📝 Title value:', post.title);

                          if (selectedArticle) {
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
                            await updatePost(selectedArticle.id, updatedPost);
                            console.log('✅ Post updated successfully');
                          } else {
                            // Create new post
                            const newPost = {
                              title: post.title,
                              content: post.content,
                              excerpt: post.excerpt,
                              status: post.status,
                              featured_media: post.featured_media,
                              categories: post.categories,
                              tags: post.tags
                            };
                            await createPost(newPost);
                            console.log('✅ New post created successfully');
                          }
                        } catch (error) {
                          console.error('❌ Error saving post:', error);
                        }
                      }}
                      onCancel={() => setCurrentView('list')}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
