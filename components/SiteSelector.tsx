'use client';

import React, { useState } from 'react';
import { useWordPress } from '@/hooks/useWordPress';
import { Globe, User, Key, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface SiteSelectorProps {
  onConnect: (siteUrl: string, username: string, appPassword: string) => Promise<boolean>;
  onBack?: () => void;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({ onConnect, onBack }) => {
  const { loading, error } = useWordPress();
  const [formData, setFormData] = useState({
    siteUrl: '',
    username: '',
    appPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.siteUrl || !formData.username || !formData.appPassword) {
      return;
    }

    // Save site to user's account
    try {
      await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: formData.siteUrl,
          username: formData.username,
          appPassword: formData.appPassword,
          siteName: new URL(formData.siteUrl).hostname
        }),
      });
    } catch (error) {
      console.error('Failed to save site:', error);
    }

    await onConnect(formData.siteUrl, formData.username, formData.appPassword);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">

      <main className="view__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
        <div className="container">
          <div className="editor-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="editor-head">
              <div className="title-left">
                <h2 className="post-title">Connect to WordPress</h2>
              </div>
            </div>
          
          <p className="muted" style={{ marginBottom: '2rem' }}>
            Enter your WordPress site details to start editing articles
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Site URL */}
              <div>
                <label htmlFor="siteUrl" style={{ display: 'block', fontWeight: '800', marginBottom: '0.5rem' }}>
                  WordPress Site URL
                </label>
                <input
                  id="siteUrl"
                  name="siteUrl"
                  type="url"
                  required
                  value={formData.siteUrl}
                  onChange={handleInputChange}
                  placeholder="https://yoursite.com"
                  className="input"
                />
                <p className="muted" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                  Enter the full URL of your WordPress site
                </p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" style={{ display: 'block', fontWeight: '800', marginBottom: '0.5rem' }}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="admin"
                  className="input"
                />
              </div>

              {/* Application Password */}
              <div>
                <label htmlFor="appPassword" style={{ display: 'block', fontWeight: '800', marginBottom: '0.5rem' }}>
                  Application Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="appPassword"
                    name="appPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.appPassword}
                    onChange={handleInputChange}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    className="input"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', top: '50%', right: '0.75rem', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" style={{ color: '#6b7280' }} />
                    ) : (
                      <Eye className="h-4 w-4" style={{ color: '#6b7280' }} />
                    )}
                  </button>
                </div>
                <p className="muted" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                  Generate this in your WordPress admin under Users → Profile → Application Passwords
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error" style={{ marginTop: '1rem' }}>
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="actions" style={{ marginTop: '2rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Connect to WordPress
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
};