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
    <div>
      {onBack && (
        <button className="tui-button" onClick={onBack}>
          Back
        </button>
      )}
      
      {error && (
        <div>
          <AlertCircle className="me-2" size={20} />
          {error}
        </div>
      )}

      {connectError && (
        <div>
          <AlertCircle className="me-2" size={20} />
          {connectError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset className="tui-input-fieldset">
          <legend>
            <Globe className="me-1" size={16} />
            WordPress Site URL
          </legend>
          <input
            type="url"
            id="siteUrl"
            name="siteUrl"
            className="tui-input"
            style={{ width: 'var(--space-250)' }}
            value={formData.siteUrl}
            onChange={handleInputChange}
            required
            placeholder="https://yoursite.com"
          />
          <div>
            Enter the full URL of your WordPress site
          </div>
        </fieldset>

        <fieldset className="tui-input-fieldset">
          <legend>
            <User className="me-1" size={16} />
            Username
          </legend>
          <input
            type="text"
            id="username"
            name="username"
            className="tui-input"
            style={{ width: 'var(--space-250)' }}
            value={formData.username}
            onChange={handleInputChange}
            required
            placeholder="your-username"
            autoComplete="username"
          />
        </fieldset>

        <fieldset className="tui-input-fieldset">
          <legend>
            <Key className="me-1" size={16} />
            Application Password
          </legend>
          <input
            type={showPassword ? 'text' : 'password'}
            id="appPassword"
            name="appPassword"
            className="tui-input"
            style={{ width: 'var(--space-250)' }}
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
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <div>
            Generate an application password in your WordPress admin under Users → Profile
          </div>
        </fieldset>

        <div>
          <button
            type="submit"
            className="tui-button"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="me-2" size={16} />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle className="me-2" size={16} />
                Connect Site
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};