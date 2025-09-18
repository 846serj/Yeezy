'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArticleGenerator } from '@/components/ArticleGenerator';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';
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
    router.push('/dashboard');
  };

  const handleArticleGenerated = (content: string, title: string, sources: string[]) => {
    // Create a mock WordPressPost object for the generated content
    const generatedArticle: WordPressPost & { isGenerated?: boolean } = {
      id: Date.now(), // Temporary ID
      date: new Date().toISOString(),
      date_gmt: new Date().toISOString(),
      guid: { rendered: '' },
      modified: new Date().toISOString(),
      modified_gmt: new Date().toISOString(),
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      status: 'draft' as const,
      type: 'post',
      link: '',
      title: { rendered: title },
      content: { rendered: content, protected: false },
      excerpt: { rendered: '', protected: false },
      author: 1,
      featured_media: 0,
      comment_status: 'open' as const,
      ping_status: 'open' as const,
      sticky: false,
      template: '',
      format: 'standard' as const,
      meta: {},
      categories: [],
      tags: [],
      _embedded: {},
      isGenerated: true, // Mark as generated article
      _links: {
        self: [{ href: '' }],
        collection: [{ href: '' }],
        about: [{ href: '' }],
        author: [{ embeddable: true, href: '' }],
        replies: [{ embeddable: true, href: '' }],
        'version-history': [{ count: 0, href: '' }],
        'predecessor-version': [{ id: 0, href: '' }],
        'wp:attachment': [{ href: '' }],
        'wp:term': [{ taxonomy: 'category', embeddable: true, href: '' }],
        curies: [{ name: 'wp', href: 'https://api.w.org/{rel}', templated: true }]
      }
    };
    
    // Redirect to editor with generated content
    // We'll pass the generated content via URL params or state
    router.push(`/editor?generated=true&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`);
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
            <ArticleGenerator
              onBack={handleBack}
              onArticleGenerated={handleArticleGenerated}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
