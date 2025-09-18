'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientOnlyGutenbergEditor } from '@/components/editor';
import SmartGutenbergEditor from '@/components/editor/SmartGutenbergEditor';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
import { EditorContent } from '@/types';

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, updatePost, createPost, uploadMedia, updateMedia } = useWordPress();
  const [useSmartEditor, setUseSmartEditor] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<{ title: string; content: string } | null>(null);

  // Check for generated content from URL params
  useEffect(() => {
    const isGenerated = searchParams.get('generated') === 'true';
    const title = searchParams.get('title');
    const content = searchParams.get('content');
    
    if (isGenerated && title && content) {
      setGeneratedContent({
        title: decodeURIComponent(title),
        content: decodeURIComponent(content)
      });
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

  const handleSave = async (post: EditorContent) => {
    try {
      console.log('💾 WordPress Gutenberg content saved:', post);
      console.log('📝 Title type:', typeof post.title);
      console.log('📝 Title value:', post.title);

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
      console.log('✅ New post created successfully');
      
      // Redirect to dashboard after successful creation
      router.push('/dashboard');
    } catch (error) {
      console.error('❌ Error saving post:', error);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
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
          ) : (
            <ClientOnlyGutenbergEditor
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
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewEditor() {
  return (
    <Suspense fallback={
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>Loading editor...</div>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
