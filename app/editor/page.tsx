'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WordPressBlockEditor, { WordPressBlockEditorRef } from '@/components/editor/components/WordPressBlockEditor';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/contexts/AuthContext';
import { EditorContent } from '@/types';
import { TuiLayout } from '@/components/TuiLayout';
import { cleanHtmlContent } from '@/lib/cleanHtml';

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, updatePost, createPost, uploadMedia, updateMedia } = useWordPress();
  const [generatedContent, setGeneratedContent] = useState<{ title: string; content: string } | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGeneratedContent, setIsLoadingGeneratedContent] = useState(false);
  const editorRef = useRef<WordPressBlockEditorRef>(null);

  // Check for generated content from localStorage or URL params
  useEffect(() => {
    const isGenerated = searchParams.get('generated') === 'true';
    
    if (isGenerated) {
      setIsLoadingGeneratedContent(true);
      
      // First try to load from localStorage (preferred method)
      try {
        const storedData = localStorage.getItem('generatedArticle');
        if (storedData) {
          const generatedData = JSON.parse(storedData);
          
          setGeneratedContent({
            title: generatedData.title,
            content: generatedData.content
          });
          // Clear localStorage after loading to prevent stale data
          localStorage.removeItem('generatedArticle');
          setIsLoadingGeneratedContent(false);
          return;
        }
      } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
      }
      
      // Fallback to URL params if localStorage is empty or fails
    const title = searchParams.get('title');
    const content = searchParams.get('content');
    
      if (title && content) {
        try {
          
      setGeneratedContent({
        title: decodeURIComponent(title),
        content: decodeURIComponent(content)
      });
        } catch (error) {
          console.error('❌ Error decoding URL parameters:', error);
          // Fallback: use the raw values if decoding fails
          setGeneratedContent({
            title: title,
            content: content
          });
        }
      }
      
      setIsLoadingGeneratedContent(false);
    }
  }, [searchParams]);

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

  const handleSave = async (post: EditorContent) => {
    try {
      
      
      

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
      const createdPost = await createPost(newPost);
      
      
      // Stay on the editor page after successful save
      // No redirect - user can continue editing
    } catch (error) {
      console.error('❌ Error saving post:', error);
    }
  };

  const handleCancel = () => {
    router.push('/posts');
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
              <div style={{ fontSize: 'var(--space-18)' }}>Loading...</div>
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

  // Show loading state while loading generated content
  if (isLoadingGeneratedContent) {
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
            <legend className="center">Loading Generated Content</legend>
            <div className="center" style={{ 
              height: 'calc(100vh - var(--space-80))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                <div className="tui-progress" style={{ width: '75%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--space-18)' }}>Loading your generated article...</p>
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
          <legend className="center">Article Editor</legend>
          
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
            <div style={{ display: 'flex', gap: 'var(--space-10)' }}>
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
                        
                        if (generatedContent) {
                          await handleSave({
                            title: generatedContent.title,
                            content: generatedContent.content,
                            excerpt: '',
                            status: 'draft' as const,
                            featured_media: null,
                            categories: [],
                            tags: []
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
              
              <button 
                className="tui-button"
                onClick={async (e) => {
                  try {
                    // Get the current content from the editor
                    const editorContent = document.querySelector('.editor-visual-editor');
                    if (!editorContent) {
                      throw new Error('Editor content not found');
                    }

                    // Extract title and content
                    const titleElement = document.querySelector('.article-title') as HTMLElement;
                    const title = titleElement?.textContent || 'Untitled';
                    const contentArea = editorContent.querySelector('.block-editor-block-list__layout');
                    const content = contentArea?.innerHTML || editorContent.innerHTML;
                    
                    // Create clean HTML
                    const cleanHtml = cleanHtmlContent(content);
                    const formattedContent = `<h1>${title}</h1>\n\n${cleanHtml}`;
                    
                    // Copy to clipboard
                    if (navigator.clipboard) {
                      await navigator.clipboard.writeText(formattedContent);
                    } else {
                      // Fallback method
                      const textarea = document.createElement('textarea');
                      textarea.value = formattedContent;
                      textarea.style.position = 'fixed';
                      textarea.style.left = '-999999px';
                      textarea.style.top = '-999999px';
                      document.body.appendChild(textarea);
                      textarea.focus();
                      textarea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textarea);
                    }
                    
                    // Show feedback
                    const button = e.currentTarget as HTMLButtonElement;
                    if (button) {
                      const originalText = button.textContent;
                      button.textContent = 'Copied!';
                      button.style.backgroundColor = 'var(--tui-color-success)';
                      
                      setTimeout(() => {
                        if (button) {
                          button.textContent = originalText;
                          button.style.backgroundColor = '';
                        }
                      }, 2000);
                    }
                  } catch (error) {
                    console.error('Copy failed:', error);
                    alert('Failed to copy content. Please try again.');
                  }
                }}
                title="Copy Article Content"
                style={{ backgroundColor: 'var(--tui-color-info)' }}
              >
                Copy
              </button>
            </div>
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
              <WordPressBlockEditor
                ref={editorRef}
                post={generatedContent ? {
                  title: generatedContent.title,
                  content: generatedContent.content,
                  excerpt: '',
                  status: 'draft' as const,
                  featured_media: null,
                  categories: [],
                  tags: []
                } : null} // New post or generated content
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

export default function NewEditor() {
  return (
    <Suspense fallback={
      <TuiLayout>
        <div className="tui-window" style={{ width: 'var(--space-400)', border: 'none' }}>
          <fieldset className="tui-fieldset">
            <legend className="center">Loading Editor</legend>
            <div className="center">
              <div className="tui-progress-bar">
                <div className="tui-progress" style={{ width: '50%' }}></div>
              </div>
              <div>Loading editor...</div>
            </div>
          </fieldset>
        </div>
      </TuiLayout>
    }>
      <EditorPageContent />
    </Suspense>
  );
}
