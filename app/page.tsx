'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSelector } from '@/components/SiteSelector';
import { AuthForm } from '@/components/AuthForm';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { site, loading: sitesLoading, error: sitesError, connect, isConnected } = useWordPress();
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  useEffect(() => {
    // TuiCss is initialized automatically
  }, []);

  // Load sites when user is authenticated
  useEffect(() => {
    const loadSites = async () => {
      if (user) {
        setLoadingSites(true);
        try {
          const response = await fetch('/api/sites');
          if (response.ok) {
            const data = await response.json();
            setSites(data.sites || []);
          }
        } catch (error) {
          console.error('Failed to load sites:', error);
        } finally {
          setLoadingSites(false);
        }
      }
    };

    loadSites();
  }, [user]);


  const handleGenerateNew = () => {
    router.push('/generate');
  };

  const handleSiteSelect = (selectedSite: any) => {
    // Set the selected site as the current site
    // This will trigger the WordPress hook to connect to that site
    router.push(`/dashboard?site=${selectedSite.id}`);
  };

  const handleConnectToWordPress = async (siteUrl: string, username: string, appPassword: string) => {
    try {
    const success = await connect(siteUrl, username, appPassword);
    if (success) {
        setShowSiteSelector(false);
        // State will be updated automatically by the hook
    }
    return success;
    } catch (error) {
      console.error('Failed to connect to WordPress:', error);
      return false;
    }
  };

  const renderContent = () => {
    if (!user) {
    return (
        <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
          height: '100%',
        padding: 'var(--space-20)'
      }}>
          <div className="tui-window" style={{ 
            width: 'var(--space-500)',
            maxWidth: '90%'
          }}>
            <fieldset className="tui-fieldset tui-border-solid" style={{
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0
            }}>
              <legend className="center">WordPress Article Editor</legend>
              <div style={{ padding: 'var(--space-20)' }}>
                <AuthForm onSuccess={(user) => login(user.email, '')} />
              </div>
            </fieldset>
            </div>
      </div>
    );
  }

    if (sitesLoading) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backgroundColor: '#c0c0c0'
        }}>
          <div 
            className="tui-window tui-border-double" 
            style={{ 
              width: '100%',
              height: '100%',
              margin: 0
            }}
          >
            <fieldset className="tui-fieldset">
              <legend className="center">Loading Sites</legend>
              <div className="center" style={{ 
                height: 'calc(100vh - var(--space-80))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                  <div className="tui-progress" style={{ width: '50%' }}></div>
                </div>
                <p style={{ fontSize: 'var(--space-18)' }}>Loading sites...</p>
              </div>
            </fieldset>
          </div>
        </div>
      );
    }

    if (sitesError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backgroundColor: '#c0c0c0'
        }}>
          <div 
            className="tui-window" 
            style={{ 
              width: '100%',
              height: '100%',
              margin: 0
            }}
          >
            <fieldset className="tui-fieldset" style={{
              width: '100%',
              height: '100vh',
              margin: 0,
              padding: 0
            }}>
              <legend className="center">❌ Error</legend>
              <div className="center" style={{ 
                height: 'calc(100vh - var(--space-80))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '500px',
                margin: '0 auto'
              }}>
                <h4 style={{ fontSize: 'var(--space-24)', marginBottom: 'var(--space-20)' }}>Error!</h4>
                <p style={{ fontSize: 'var(--space-18)', marginBottom: 'var(--space-20)', textAlign: 'center' }}>Error: {sitesError}</p>
                <div className="tui-divider" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}></div>
                <p style={{ fontSize: 'var(--space-18)' }}>Please try again.</p>
              </div>
            </fieldset>
          </div>
        </div>
      );
    }
    
    if (loadingSites) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backgroundColor: '#c0c0c0'
        }}>
          <div 
            className="tui-window tui-border-double" 
            style={{ 
              width: '100%',
              height: '100%',
              margin: 0
            }}
          >
            <fieldset className="tui-fieldset">
              <legend className="center">Loading Sites</legend>
              <div className="center" style={{ 
                height: 'calc(100vh - var(--space-80))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                  <div className="tui-progress" style={{ width: '75%' }}></div>
                </div>
                <p style={{ fontSize: 'var(--space-18)' }}>Loading sites...</p>
              </div>
            </fieldset>
          </div>
        </div>
      );
    }

    if (sites.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          padding: 'var(--space-20)'
        }}>
          <div className="tui-window" style={{ width: 'var(--space-600)' }}>
            <fieldset className="tui-fieldset tui-border-solid" style={{
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0
            }}>
              <legend className="center">Connect to WordPress</legend>
              <div style={{ padding: 'var(--space-20)' }}>
                <SiteSelector 
                  onConnect={handleConnectToWordPress}
                />
              </div>
            </fieldset>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: '#c0c0c0'
      }}>
        {/* Site Selector Modal */}
        {showSiteSelector && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <div className="tui-window" style={{ width: 'var(--space-600)' }}>
              <fieldset className="tui-fieldset tui-border-solid" style={{
                width: '100%',
                height: '100%',
                margin: 0,
                padding: 0
              }}>
                <legend className="center">Add WordPress Site</legend>
                <div style={{ padding: 'var(--space-20)' }}>
                  <SiteSelector 
                    onConnect={handleConnectToWordPress}
                  />
                  <div style={{ marginTop: 'var(--space-20)', textAlign: 'center' }}>
                    <button 
                      className="tui-button"
                      onClick={() => setShowSiteSelector(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        )}

        <div 
          id="websites-window"
          className="tui-window" 
          style={{ 
            width: '100%',
            height: '100%',
            margin: 0
          }}
        >
          <fieldset className="tui-fieldset" style={{
            width: '100%',
            height: '100vh',
            margin: 0,
            padding: '40px'
          }}>
            <legend className="center">Websites</legend>
                  
                  {/* Websites List */}
                  <div style={{ 
                    height: 'calc(100vh - var(--space-80))',
                    overflow: 'auto',
                    maxWidth: '500px',
                    margin: '0 auto'
                  }}>
                    {/* Action Buttons */}
                    <div style={{ marginBottom: 'var(--space-20)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        className="tui-button"
                        onClick={() => setShowSiteSelector(true)}
                      >
                        Add Site
                      </button>
                    </div>
                  
                  {/* Sites List */}
                  {sites.length === 0 ? (
                    <div className="center">
                      <h3>No sites connected</h3>
                      <p>Connect to your first WordPress site to get started.</p>
                      <button 
                        className="tui-button"
                        onClick={() => setShowSiteSelector(true)}
                      >
                        <span className="tui-shortcut">F2</span> Connect Site
                      </button>
                    </div>
                  ) : (
                    <table className="tui-table hovered-cyan striped-purple" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Site Name</th>
                          <th>URL</th>
                          <th>User</th>
                          {/* <th>Actions</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((siteItem, index) => (
                          <tr
                            key={`${siteItem.id}-${index}`}
                            onClick={() => handleSiteSelect(siteItem)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
                                {siteItem.site_name || 'Unnamed Site'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.9em', color: '#888' }}>
                                {siteItem.site_url}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.9em' }}>
                                {siteItem.username}
                              </div>
                            </td>
                            {/* <td>
                              <button 
                                className="tui-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSiteSelect(siteItem);
                                }}
                              >
                                <span className="tui-shortcut">Enter</span> View Posts
                              </button>
                            </td> */}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  </div>
          </fieldset>
        </div>
      </div>
    );
  };

  return (
    <div className="screen" style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#c0c0c0',
      padding: 'var(--space-20)'
    }}>
      {renderContent()}
    </div>
  );
}