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
  sites: SavedSite[];
  onSiteSelect: (site: SavedSite) => void;
  selectedSite?: SavedSite | null;
  onAddSite?: () => void;
  onDeleteSite?: (siteId: number) => void;
}

export const SiteList: React.FC<SiteListProps> = ({ 
  sites, 
  onSiteSelect, 
  selectedSite,
  onAddSite,
  onDeleteSite 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSiteSelect = (site: SavedSite) => {
    onSiteSelect(site);
  };

  const handleDelete = async (siteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this site connection?')) {
      return;
    }

    if (onDeleteSite) {
      try {
        setLoading(true);
        await onDeleteSite(siteId);
      } catch (err) {
        setError('Failed to delete site');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!sites || sites.length === 0) {
    return (
      <div className="text-center py-4">
        <Globe size={48} className="text-muted mb-3" />
        <h4 className="text-muted">No WordPress sites connected</h4>
        <p className="text-muted mb-3">
          Connect your first WordPress site to start editing articles
        </p>
        {onAddSite && (
          <button className="btn btn-primary" onClick={onAddSite}>
            <Plus className="me-2" size={16} />
            Add WordPress Site
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <AlertCircle className="me-2" size={20} />
          {error}
        </div>
      )}

      <div className="row">
        {sites?.map((site) => (
          <div key={site.id} className="col-md-6 mb-3">
            <div 
              className={`card h-100 ${selectedSite?.id === site.id ? 'border-primary' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleSiteSelect(site)}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="card-title mb-0">
                    {site.site_name || new URL(site.site_url).hostname}
                  </h5>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(site.site_url, '_blank');
                      }}
                      title="Open site"
                    >
                      <ExternalLink size={14} />
                    </button>
                    {onDeleteSite && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={(e) => handleDelete(site.id, e)}
                        disabled={loading}
                        title="Delete site"
                      >
                        {loading ? (
                          <Loader2 size={14} className="spinner-border-sm" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="card-text text-muted small mb-2">
                  <Globe className="me-1" size={12} />
                  {site.site_url}
                </p>
                
                <p className="card-text small text-muted mb-0">
                  Connected as: {site.username}
                </p>
                
                <div className="mt-2">
                  <small className="text-muted">
                    Added: {new Date(site.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onAddSite && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-primary" onClick={onAddSite}>
            <Plus className="me-2" size={16} />
            Add Another Site
          </button>
        </div>
      )}
    </div>
  );
};