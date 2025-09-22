'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ClientOnlyGutenbergEditor } from '@/components/editor';
import SmartGutenbergEditor, { SmartGutenbergEditorRef } from '@/components/editor/SmartGutenbergEditor';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { TuiLayout } from '@/components/TuiLayout';
import { WordPressPost, EditorContent } from '@/types';
// Removed React95 imports - using Bootstrap/386 components

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
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<SmartGutenbergEditorRef>(null);

  // Redirect to site selection if not connected
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    } else if (!authLoading && isAuthenticated && !isConnected) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isConnected, router]);

  // Set window properties for WordPress functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.wordPressUpload = uploadMedia;
      window.wordPressUpdateMedia = updateMedia;
    }
  }, [uploadMedia, updateMedia]);

  // Monitor upload state from the editor component
  useEffect(() => {
    const checkEditorState = () => {
      if (editorRef.current) {
        // Get upload state from the editor component
        const editorState = editorRef.current.getUploadState?.();
        if (editorState) {
          setIsUploadingImages(editorState.hasUploadingImages);
          setIsSaving(editorState.isSaving);
        }
      }
    };

    // Check immediately
    checkEditorState();

    // Set up interval to check periodically
    const interval = setInterval(checkEditorState, 500);

    return () => clearInterval(interval);
  }, []);

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
        
      }
      
      // Stay on the editor page after successful save
      // No redirect - user can continue editing
    } catch (error) {
      console.error('❌ Error saving post:', error);
    }
  };

  const handleCancel = () => {
    router.push('/posts');
  };

  // Show loading while checking authentication or loading article
  if (authLoading || loading) {
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
            padding: 0
          }}>
            <legend className="center">Loading Editor</legend>
            <div className="center" style={{ 
              height: 'calc(100vh - var(--space-80))',
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
              <div style={{ fontSize: 'var(--space-18)' }}>{loading ? 'Loading article...' : 'Loading...'}</div>
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

  // Show error if article failed to load
  if (error) {
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
            <legend className="center">❌ Error</legend>
            <div className="center" style={{ 
              height: 'calc(100vh - var(--space-80))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h4 style={{ fontSize: 'var(--space-24)', marginBottom: 'var(--space-20)' }}>Error</h4>
              <p style={{ fontSize: 'var(--space-18)', marginBottom: 'var(--space-30)', textAlign: 'center' }}>{error}</p>
              <button className="tui-button" onClick={() => router.push('/dashboard')}>
                &lt; Dashboard
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    );
  }

  // Show loading if article not loaded yet
  if (!article) {
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
            padding: 0
          }}>
            <legend className="center">Loading Article</legend>
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
              <div style={{ fontSize: 'var(--space-18)' }}>Loading article...</div>
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
          id="article-editor-window"
          className="tui-window" 
          style={{ 
            width: '100%',
            minHeight: '100vh',
            margin: 0
          }}
        >
        <fieldset className="tui-fieldset" style={{
          width: '100%',
          minHeight: '100vh',
          margin: 0,
          padding: '40px'
        }}>
          <legend className="center">Article Editor - {article?.title?.rendered || 'Loading...'}</legend>
          
          {/* Editor Content */}
          <div style={{ 
            minHeight: 'calc(100vh - var(--space-120))',
            overflow: 'visible',
            maxWidth: '500px',
            margin: '0 auto',
            width: '100%'
          }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
                <button
                  className="tui-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                      router.push('/posts');
                      
                    } catch (error) {
                      console.error('❌ Navigation failed:', error);
                      // Fallback: use window.location
                      window.location.href = '/dashboard';
                    }
                  }}
                  title="Back to Posts"
                >
                  &lt;
                </button>
                {isUploadingImages || isSaving ? (
                  <span className="tui-button disabled">
                    {isSaving ? 'Saving...' : 'Uploading...'}
                  </span>
                ) : (
                  <button 
                    className="tui-button"
                    onClick={async () => {
                      try {
                        // Use the handleSaveWithUploadCheck function directly from the editor ref
                        if (editorRef.current) {
                          await editorRef.current.handleSaveWithUploadCheck();
                        } else {
                          // Fallback: use our handleSave function directly
                          
                          if (article) {
                            await handleSave({
                              title: article.title.rendered,
                              content: article.content.rendered,
                              excerpt: article.excerpt.rendered,
                              status: article.status as 'publish' | 'draft' | 'private' | 'pending',
                              featured_media: article.featured_media,
                              categories: article.categories || [],
                              tags: article.tags || []
                            });
                          }
                        }
                      } catch (error) {
                        console.error('❌ Error in TuiCss save button:', error);
                      }
                    }}
                    title="Save Article"
                  >
                    Save
                  </button>
                )}
              </div>
              
              
              {/* Editor Content - Constrained to table width */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                width: '100%', 
                maxWidth: '100%',
                minHeight: 'auto',
                overflow: 'visible',
                position: 'relative'
              }}>
                {/* Always use smart editor - client only editor commented out */}
                <SmartGutenbergEditor
                  ref={editorRef}
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
              </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
