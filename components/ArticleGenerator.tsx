'use client';

import React, { useState } from 'react';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { WORD_RANGES, DEFAULT_WORDS } from '@/constants/lengthOptions';

interface ArticleGeneratorProps {
  onBack: () => void;
  onArticleGenerated: (content: string, title: string, sources: string[]) => void;
}

export const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({ onBack, onArticleGenerated }) => {
  const [title, setTitle] = useState('');
  const [articleType, setArticleType] = useState<'Blog post' | 'Listicle/Gallery' | 'Rewrite blog post'>('Blog post');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Additional fields for different article types
  const [videoLink, setVideoLink] = useState('');
  const [blogLink, setBlogLink] = useState('');
  const [lengthOption, setLengthOption] = useState<'default' | 'custom' | 'shorter' | 'short' | 'medium' | 'longForm' | 'longer'>('default');
  const [customSections, setCustomSections] = useState<number>(5);
  const [toneOfVoice, setToneOfVoice] = useState('SEO Optimized (Confident, Knowledgeable, Neutral, and Clear)');
  const [pointOfView, setPointOfView] = useState('First Person Singular');
  const [modelVersion, setModelVersion] = useState('gpt-4o-mini');
  const [useSerpApi, setUseSerpApi] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);


  // Helper function to get word count display
  const getWordCountDisplay = (option: string) => {
    if (option === 'default') {
      return `~${DEFAULT_WORDS} words`;
    }
    if (option === 'custom') {
      return `${customSections} sections`;
    }
    const range = WORD_RANGES[option];
    if (range) {
      return `${range[0]}-${range[1]} words`;
    }
    return '';
  };


  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (articleType === 'Rewrite blog post' && !blogLink.trim()) {
      setError('Please enter a blog post URL to rewrite');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Starting article generation...');

    try {
      // Prepare the payload for the mvp-main API
      const payload = {
        title,
        articleType,
        customInstructions: customInstructions.trim() || undefined,
        toneOfVoice,
        pointOfView,
        modelVersion,
        useSerpApi,
        includeLinks,
        lengthOption,
        customSections: lengthOption === 'custom' ? customSections : undefined,
        ...(articleType === 'Rewrite blog post' && { blogLink }),
      };

      // Call the local API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      // Add progress updates
      setProgress('Sending request to AI...');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setProgress('Processing AI response...');

      
      
      
      // Handle different error status codes
      if (response.status === 504) {
        throw new Error('Request timed out. The article generation is taking longer than expected. Please try again with a shorter article or different settings.');
      }
      
      if (response.status === 500) {
        throw new Error('Server error occurred during generation. Please check your API keys and try again.');
      }
      
      if (response.status === 400) {
        throw new Error('Invalid request. Please check your input and try again.');
      }
      
      const data = await response.json();
      

      if (!response.ok || !data.content) {
        throw new Error(data.error || 'Failed to generate article');
      }

      // Pass the generated content back to the parent
      onArticleGenerated(data.content, title, data.sources || []);
      
    } catch (err: any) {
      console.error('Generation error:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timed out. The article generation is taking longer than expected. Please try again with a shorter article or different settings.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to generate article. Please try again.');
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 'var(--space-600)'
      }}>
          {/* Spacing above back button */}
          <div style={{ height: '40px' }}></div>
          
          {/* Header with Back Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
            <button
              className="tui-button"
              onClick={onBack}
              title="Back to Dashboard"
            >
              &lt;
            </button>
          </div>
          
          {/* 20px spacing div */}
          <div style={{ height: '20px' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            {/* Title */}
            <fieldset className="tui-input-fieldset">
              <legend>Article Title *</legend>
              <input
                type="text"
                className="tui-input"
                placeholder="Enter your article title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%' // 1/3 wider (100% + 33.33% = 133.33%)
                }}
              />
            </fieldset>

            {/* Article Type */}
            <fieldset className="tui-input-fieldset">
              <legend>Article Type</legend>
              <select
                className="tui-select"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value as 'Blog post' | 'Listicle/Gallery' | 'Rewrite blog post')}
                style={{ width: '100%' }}
              >
                <option value="Blog post">Blog post</option>
                <option value="Listicle/Gallery">Listicle/Gallery</option>
                <option value="Rewrite blog post">Rewrite blog post</option>
              </select>
            </fieldset>

            {/* Custom Instructions */}
            <fieldset className="tui-input-fieldset">
              <legend>Custom Instructions (optional)</legend>
              <textarea
                className="tui-textarea"
                placeholder="Any specific guidance for the article"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                style={{
                  color: '#000' // Black text instead of yellow
                }}
              />
            </fieldset>

            {/* Blog Link for Rewrite */}
            {articleType === 'Rewrite blog post' && (
              <fieldset className="tui-input-fieldset">
                <legend>Blog Post URL *</legend>
                <input
                  type="url"
                  className="tui-input"
                  placeholder="https://example.com/your-post"
                  value={blogLink}
                  onChange={(e) => setBlogLink(e.target.value)}
                />
              </fieldset>
            )}

            {/* Length Options for Blog posts */}
            {articleType === 'Blog post' && (
              <fieldset className="tui-input-fieldset">
                <legend>Article Length</legend>
                <select
                  className="tui-select"
                  value={lengthOption}
                  onChange={(e) => setLengthOption(e.target.value as 'default' | 'custom' | 'shorter' | 'short' | 'medium' | 'longForm' | 'longer')}
                  style={{ width: '100%', marginBottom: 'var(--space-12)' }}
                >
                  <option value="default">Default - {getWordCountDisplay('default')}</option>
                  <option value="shorter">Shorter - {getWordCountDisplay('shorter')}</option>
                  <option value="short">Short - {getWordCountDisplay('short')}</option>
                  <option value="medium">Medium - {getWordCountDisplay('medium')}</option>
                  <option value="longForm">Long Form - {getWordCountDisplay('longForm')}</option>
                  <option value="longer">Longer - {getWordCountDisplay('longer')}</option>
                  <option value="custom">Custom - {getWordCountDisplay('custom')}</option>
                </select>
                {lengthOption === 'custom' && (
                  <div>
                    <label>Number of sections:</label>
                    <input
                      type="number"
                      className="tui-input"
                      min="1"
                      max="20"
                      value={customSections}
                      onChange={(e) => setCustomSections(parseInt(e.target.value) || 5)}
                    />
                  </div>
                )}
              </fieldset>
            )}

            {/* Link Options for Blog posts */}
            {articleType === 'Blog post' && (
              <fieldset className="tui-input-fieldset">
                <legend>Link Options</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                    <input
                      type="checkbox"
                      checked={useSerpApi}
                      onChange={(e) => setUseSerpApi(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span>Use SERP API for research</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                    <input
                      type="checkbox"
                      checked={includeLinks}
                      onChange={(e) => setIncludeLinks(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span>Include external links in article</span>
                  </label>
                </div>
              </fieldset>
            )}

            {/* Progress indicator */}
            {loading && (
              <div className="tui-fieldset">
                <legend>Generation Progress</legend>
                <div className="tui-progress-bar">
                  <div className="tui-progress" style={{ width: '50%' }}></div>
                </div>
                <p>{progress}</p>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div style={{
                padding: 'var(--space-10)',
                backgroundColor: '#ffebee',
                border: 'var(--space-1) solid #f44336',
                borderRadius: 'var(--space-4)',
                color: '#c62828'
              }}>
                {error}
              </div>
            )}

            {/* 20px spacing above button */}
            <div style={{ height: '20px' }}></div>

            {/* Generate Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="tui-button"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    Creating Article...
                  </>
                ) : (
                  'Create Article'
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};