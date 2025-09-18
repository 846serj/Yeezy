'use client';

import React, { useState } from 'react';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';

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
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 seconds timeout
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);
      
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
      console.log('📡 API Response data:', data);

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
    }
  };

  const labelStyle = 'block text-sm font-medium text-gray-700 mb-2';
  const inputStyle = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </button>
        <h2 className="text-2xl font-bold">Generate New Article</h2>
        <p className="text-gray-600 mt-2">Create AI-generated content for your WordPress site</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        {/* Title */}
        <div>
          <label className={labelStyle}>Article Title *</label>
          <input
            type="text"
            className={inputStyle}
            placeholder="Enter your article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Article Type */}
        <div>
          <label className={labelStyle}>Article Type</label>
          <select
            className={inputStyle}
            value={articleType}
            onChange={(e) => setArticleType(e.target.value as any)}
          >
            <option value="Blog post">Blog post</option>
            <option value="Listicle/Gallery">Listicle/Gallery</option>
            <option value="Rewrite blog post">Rewrite blog post</option>
          </select>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className={labelStyle}>Custom Instructions (optional)</label>
          <textarea
            className={inputStyle}
            rows={3}
            placeholder="Any specific guidance for the article"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
          />
        </div>

        {/* Blog Link for Rewrite */}
        {articleType === 'Rewrite blog post' && (
          <div>
            <label className={labelStyle}>Blog Post URL *</label>
            <input
              type="url"
              className={inputStyle}
              placeholder="https://example.com/your-post"
              value={blogLink}
              onChange={(e) => setBlogLink(e.target.value)}
            />
          </div>
        )}

        {/* Length Options for Blog posts */}
        {articleType === 'Blog post' && (
          <div>
            <label className={labelStyle}>Article Length</label>
            <select
              className={inputStyle}
              value={lengthOption}
              onChange={(e) => setLengthOption(e.target.value as any)}
            >
              <option value="default">Default (~1,900 words)</option>
              <option value="shorter">Shorter (450-900 words)</option>
              <option value="short">Short (950-1,350 words)</option>
              <option value="medium">Medium (1,350-1,870 words)</option>
              <option value="longForm">Long Form (1,900-2,440 words)</option>
              <option value="longer">Longer (2,350-2,940 words)</option>
              <option value="custom">Custom</option>
            </select>
            {lengthOption === 'custom' && (
              <input
                type="number"
                className={`${inputStyle} mt-2`}
                placeholder="Number of sections"
                value={customSections}
                onChange={(e) => setCustomSections(Number(e.target.value))}
                min="1"
              />
            )}
          </div>
        )}

        {/* Tone of Voice */}
        <div>
          <label className={labelStyle}>Tone of Voice</label>
          <select
            className={inputStyle}
            value={toneOfVoice}
            onChange={(e) => setToneOfVoice(e.target.value)}
          >
            <option value="SEO Optimized (Confident, Knowledgeable, Neutral, and Clear)">SEO Optimized</option>
            <option value="Professional">Professional</option>
            <option value="Friendly">Friendly</option>
            <option value="Casual">Casual</option>
            <option value="Formal">Formal</option>
            <option value="Excited">Excited</option>
            <option value="Humorous">Humorous</option>
          </select>
        </div>

        {/* Point of View */}
        <div>
          <label className={labelStyle}>Point of View</label>
          <select
            className={inputStyle}
            value={pointOfView}
            onChange={(e) => setPointOfView(e.target.value)}
          >
            <option value="First Person Singular">First Person Singular (I, me, my)</option>
            <option value="First Person Plural">First Person Plural (we, us, our)</option>
            <option value="Second Person">Second Person (you, your)</option>
            <option value="Third Person">Third Person (he, she, it, they)</option>
          </select>
        </div>

        {/* Model Version */}
        <div>
          <label className={labelStyle}>AI Model</label>
          <select
            className={inputStyle}
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
          >
            <option value="gpt-4o">GPT-4o (Most capable)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (Faster, cheaper)</option>
            <option value="gpt-4">GPT-4 (Classic)</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</option>
          </select>
        </div>

        {/* SERP API Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="use-serp-api"
              type="checkbox"
              checked={useSerpApi}
              onChange={(e) => setUseSerpApi(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="use-serp-api" className="ml-2 text-sm font-medium text-gray-700">
              Use SERP API for sources and research
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="include-links"
              type="checkbox"
              checked={includeLinks}
              onChange={(e) => setIncludeLinks(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="include-links" className="ml-2 text-sm font-medium text-gray-700">
              Include external links in the article
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Article...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generate Article
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
