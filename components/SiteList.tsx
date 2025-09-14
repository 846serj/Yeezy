'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  Globe
} from 'lucide-react';

interface SavedSite {
  id: number;
  site_url: string;
  username: string;
  app_password: string;
  site_name?: string;
  created_at: string;
}

interface SiteListProps {
  onConnect: (siteUrl: string, username: string, appPassword: string) => Promise<boolean>;
}

export function SiteList({ onConnect }: SiteListProps) {
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingSite, setAddingSite] = useState(false);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (response.ok) {
        const data = await response.json();
        setSites(data.sites || []);
      } else {
        setError('Failed to load saved sites');
      }
    } catch (err) {
      setError('Failed to load saved sites');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (site: SavedSite) => {
    setConnecting(site.id);
    try {
      // Use the stored app password directly
      const success = await onConnect(site.site_url, site.username, site.app_password);
      if (!success) {
        alert('Failed to connect. Please check your credentials.');
      }
    } catch (err) {
      alert('Failed to connect. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  const handleDelete = async (siteId: number) => {
    if (!confirm('Are you sure you want to delete this site?')) return;
    
    try {
      const response = await fetch(`/api/sites?id=${siteId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSites(sites.filter(site => site.id !== siteId));
      } else {
        alert('Failed to delete site');
      }
    } catch (err) {
      alert('Failed to delete site');
    }
  };

  const handleAddSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingSite(true);
    
    const formData = new FormData(e.currentTarget);
    const siteUrl = formData.get('siteUrl') as string;
    const username = formData.get('username') as string;
    const appPassword = formData.get('appPassword') as string;
    const siteName = formData.get('siteName') as string;
    
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl,
          username,
          appPassword,
          siteName: siteName || undefined
        }),
      });
      
      if (response.ok) {
        setShowAddModal(false);
        fetchSites(); // Refresh the sites list
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add site');
      }
    } catch (err) {
      alert('Failed to add site');
    } finally {
      setAddingSite(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredSites = sites.filter(site => 
    site.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.site_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="center" style={{ padding: '4rem 0' }}>
        <div>
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>Failed to load sites</h3>
          <p className="muted" style={{ marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={fetchSites}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Add Site Button */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>WordPress Sites</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus className="h-4 w-4" />
          Add Site
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th scope="col" style={{ padding: '0.5rem 0', fontWeight: '600' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>Site</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      border: '4px solid #000', 
                      borderRadius: '20px', 
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      width: '137.5px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.border = '4px solid #3b82f6'}
                    onBlur={(e) => e.target.style.border = '4px solid #000'}
                  />
                </div>
              </th>
              <th scope="col" style={{ padding: '0.5rem 0', fontWeight: '600' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="status-cell center">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading sites...
                </td>
              </tr>
            ) : filteredSites.length === 0 ? (
              <tr>
                <td colSpan={2} className="status-cell muted center">
                  {searchTerm
                    ? 'No sites found matching your search.'
                    : 'No sites saved yet.'}
                </td>
              </tr>
            ) : (
              filteredSites.map((site) => (
                <tr 
                  key={site.id} 
                  className="scaleOnHover" 
                  style={{ borderBottom: '4px solid #000', cursor: 'pointer' }}
                  onClick={() => handleConnect(site)}
                >
                  <td style={{ padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe className="h-4 w-4" style={{ color: '#6b7280' }} />
                      <div>
                        <div
                          className="row-link"
                          style={{ color: '#000000', fontWeight: '600', marginBottom: '0.25rem' }}
                        >
                          {site.site_name || site.site_url}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {site.site_url}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          Added {formatDate(site.created_at)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="status-cell" style={{ textAlign: 'right', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {connecting === site.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Connecting...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(site.site_url, '_blank');
                            }}
                            className="btn"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem'
                            }}
                            title="Visit site"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(site.id);
                            }}
                            className="btn"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.875rem',
                              color: '#ef4444',
                              borderColor: '#ef4444'
                            }}
                            title="Delete site"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'black' }}>
              Add WordPress Site
            </h3>
            
            <form onSubmit={handleAddSite}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Site URL *
                </label>
                <input
                  type="url"
                  name="siteUrl"
                  required
                  placeholder="https://yoursite.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="your_username"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Application Password *
                </label>
                <input
                  type="password"
                  name="appPassword"
                  required
                  placeholder="Your WordPress App Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Generate this in WordPress: Users → Profile → Application Passwords
                </p>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Site Name (Optional)
                </label>
                <input
                  type="text"
                  name="siteName"
                  placeholder="My Blog"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={addingSite}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingSite}
                >
                  {addingSite ? 'Adding...' : 'Add Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
