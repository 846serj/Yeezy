'use client';

import React, { useState, useEffect } from 'react';
import { useWordPress } from '@/hooks/useWordPress';
import { Eye, ExternalLink, RefreshCw } from 'lucide-react';

interface PreviewPanelProps {
  postId?: number;
  content: string;
  title: string;
  className?: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  postId,
  content,
  title,
  className = '',
}) => {
  const { api, site } = useWordPress();
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch rendered content when postId changes
  useEffect(() => {
    if (postId && api && showPreview) {
      fetchRenderedContent();
    }
  }, [postId, api, showPreview]);

  const fetchRenderedContent = async () => {
    if (!api || !postId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get the post with 'view' context to get rendered content
      const post = await api.getPost(postId, 'view');
      setRenderedContent(post.content.rendered);
    } catch (err) {
      console.error('Failed to fetch rendered content:', err);
      setError('Failed to load preview. Using raw content instead.');
      // Fallback to raw content with basic processing
      setRenderedContent(processRawContent(content));
    } finally {
      setIsLoading(false);
    }
  };

  const processRawContent = (rawContent: string): string => {
    // Basic processing for raw content when we can't get rendered content
    return rawContent
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  const openInNewTab = () => {
    if (postId && site?.isConnected) {
      // Open the actual WordPress post in a new tab
      const postUrl = `${site.site_url}/wp-admin/post.php?post=${postId}&action=edit`;
      window.open(postUrl, '_blank');
    } else {
      // For new posts, we can't open in WordPress admin yet
      alert('Save the post first to preview in WordPress admin');
    }
  };

  const refreshPreview = () => {
    if (postId && api) {
      fetchRenderedContent();
    } else {
      // For new posts, just process the raw content
      setRenderedContent(processRawContent(content));
    }
  };

  const displayContent = showPreview ? renderedContent : processRawContent(content);

  return (
    <div className={`preview-panel ${className}`}>
      {/* Preview Controls */}
      <div className="preview-controls" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3)',
        borderBottom: 'var(--space-1) solid #ddd',
        background: '#f9f9f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Eye className="h-4 w-4" />
          <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
            Preview
          </span>
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--space-3)',
              border: 'var(--space-1) solid #ddd',
              background: showPreview ? '#0073aa' : '#fff',
              color: showPreview ? '#fff' : '#333',
              borderRadius: 'var(--space-4)',
              cursor: 'pointer'
            }}
          >
            {showPreview ? 'Raw Content' : 'Rendered Preview'}
          </button>
          
          <button
            onClick={refreshPreview}
            disabled={isLoading}
            style={{
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--space-3)',
              border: 'var(--space-1) solid #ddd',
              background: '#fff',
              color: '#333',
              borderRadius: 'var(--space-4)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          
          {postId && (
            <button
              onClick={openInNewTab}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--space-3)',
                border: 'var(--space-1) solid #ddd',
                background: '#fff',
                color: '#333',
                borderRadius: 'var(--space-4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)'
              }}
            >
              <ExternalLink className="h-3 w-3" />
              Open in WP
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview-content" style={{
        padding: 'var(--space-4)',
        minHeight: 'var(--space-200)',
        maxHeight: 'var(--space-600)',
        overflowY: 'auto',
        background: '#fff'
      }}>
        {error && (
          <div style={{
            padding: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            background: '#fff3cd',
            border: 'var(--space-1) solid #ffeaa7',
            borderRadius: 'var(--space-4)',
            color: '#856404',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-8)',
            color: '#666'
          }}>
            <RefreshCw className="h-6 w-6 animate-spin" style={{ marginRight: 'var(--space-2)' }} />
            Loading preview...
          </div>
        ) : (
          <div>
            {/* Preview Title */}
            <h1 style={{
              fontSize: 'var(--space-8)',
              fontWeight: '600',
              marginBottom: 'var(--space-4)',
              color: '#1e1e1e',
              lineHeight: '1.3'
            }}>
              {title || 'Untitled'}
            </h1>
            
            {/* Preview Content */}
            <div 
              dangerouslySetInnerHTML={{ __html: displayContent }}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
                fontSize: 'var(--space-14)',
                lineHeight: '1.6',
                color: '#1e1e1e'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
