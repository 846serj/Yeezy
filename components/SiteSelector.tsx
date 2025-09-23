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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsConnecting(true);
    setConnectError(null);

    try {
      const success = await onConnect(formData.siteUrl, formData.username, formData.appPassword);
      
      if (!success) {
        setConnectError('Failed to connect to WordPress site. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('❌ SiteSelector: Connection error:', err);
      setConnectError(err.message || 'An error occurred while connecting to the site.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="center">
        <Loader2 className="spinner" size={32} />
        <p>Loading sites...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      {onBack && (
        <button className="tui-button" onClick={onBack} style={{ marginBottom: 'var(--space-20)' }}>
          Back
        </button>
      )}
      
      {error && (
        <div style={{ marginBottom: 'var(--space-20)', color: '#ff6b6b' }}>
          <AlertCircle className="me-2" size={16} />
          {error}
        </div>
      )}

      {connectError && (
        <div style={{ marginBottom: 'var(--space-20)', color: '#ff6b6b' }}>
          <AlertCircle className="me-2" size={16} />
          {connectError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        <fieldset className="tui-input-fieldset">
          <legend>
            <Globe className="me-1" size={14} />
            WordPress Site URL
          </legend>
          <input
            type="url"
            id="siteUrl"
            name="siteUrl"
            className="tui-input"
            style={{ width: '100%', maxWidth: 'var(--space-200)' }}
            value={formData.siteUrl}
            onChange={handleInputChange}
            required
            placeholder="https://yoursite.com"
          />
          <div style={{ fontSize: '0.85em', color: '#888', marginTop: 'var(--space-4)' }}>
            Enter the full URL of your WordPress site
          </div>
        </fieldset>

        <fieldset className="tui-input-fieldset">
          <legend>
            <User className="me-1" size={14} />
            Username
          </legend>
          <input
            type="text"
            id="username"
            name="username"
            className="tui-input"
            style={{ width: '100%', maxWidth: 'var(--space-200)' }}
            value={formData.username}
            onChange={handleInputChange}
            required
            placeholder="your-username"
            autoComplete="username"
          />
        </fieldset>

        <fieldset className="tui-input-fieldset">
          <legend>
            <Key className="me-1" size={14} />
            Application Password
          </legend>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="appPassword"
              name="appPassword"
              className="tui-input"
              style={{ width: '100%', maxWidth: 'var(--space-180)' }}
              value={formData.appPassword}
              onChange={handleInputChange}
              required
              placeholder="Enter your app password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="tui-button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ padding: 'var(--space-4)', minWidth: 'auto' }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div style={{ fontSize: '0.85em', color: '#888', marginTop: 'var(--space-4)' }}>
            Generate an application password in your WordPress admin under Users → Profile
          </div>
        </fieldset>

        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
          <button
            type="submit"
            className="tui-button"
            disabled={isConnecting}
            style={{ minWidth: 'var(--space-120)' }}
          >
            {isConnecting ? (
              <>
                <Loader2 className="me-2" size={14} />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle className="me-2" size={14} />
                Connect Site
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};