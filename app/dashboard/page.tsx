'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSelector } from '@/components/SiteSelector';
import { AuthForm } from '@/components/AuthForm';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const { site, loading: sitesLoading, error: sitesError, connect, isConnected } = useWordPress();
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    router.push(`/posts?site=${selectedSite.id}`);
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
          width: '100%', 
          margin: '0px', 
          padding: '0px', 
          height: '100vh',
          overflow: 'hidden'
        }}>
          <fieldset className="tui-fieldset" style={{ 
            width: '100%', 
            margin: '0px', 
            padding: '20px', 
            height: '100vh',
            overflow: 'hidden',
            border: '6px white double !important'
          }}>
            <legend className="center" style={{ color: 'white' }}>Yeez.ai</legend>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 'clamp(1rem, 4vw, 2rem)',
              width: '100%',
              margin: '0 auto',
              height: 'calc(100vh - 80px)',
              overflow: 'hidden',
              padding: 'clamp(1rem, 2vw, 2rem)'
            }}>
              {/* Demo video window */}
              <div style={{ 
                width: '100%',
                maxWidth: 'min(700px, 75vw)',
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'clamp(0.5rem, 2vw, 1rem)',
                gap: '0.5rem'
              }}>
                <div style={{ 
                  textAlign: 'center',
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: '1.2',
                  maxWidth: '100%'
                }}>
                  Add images to your articles instantly:
                </div>
                <div style={{ height: '0px', width: '100%' }}></div>
                <video 
                  src="/gif.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%',
                    height: 'auto',
                    aspectRatio: '16/9',
                    borderRadius: '0px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ height: '0px', width: '100%' }}></div>
                <button
                  className="tui-button tui-button-green"
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                    padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
                    fontWeight: 'bold',
                    minWidth: 'clamp(150px, 40vw, 250px)',
                    maxWidth: '100%',
                    width: 'auto',
                    backgroundColor: '#00a800',
                    color: 'white',
                    borderColor: '#00a800',
                    transition: 'all 0.2s ease',
                    borderRadius: '0px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#008000', 'important');
                    e.currentTarget.style.setProperty('border-color', '#008000', 'important');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#00a800', 'important');
                    e.currentTarget.style.setProperty('border-color', '#00a800', 'important');
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#006600', 'important');
                    e.currentTarget.style.setProperty('border-color', '#006600', 'important');
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.setProperty('background-color', '#008000', 'important');
                    e.currentTarget.style.setProperty('border-color', '#008000', 'important');
                  }}
                >
                  Try for Free
                </button>
                
                {/* Logos */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: 'clamp(1rem, 3vw, 2rem)',
                  marginTop: 'clamp(1rem, 2vw, 1.5rem)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    color: 'white',
                    fontWeight: '500',
                    marginRight: 'clamp(0.5rem, 1vw, 1rem)'
                  }}>
                    Trusted by:
                  </div>
                  <img 
                    src="/image_1.jpeg" 
                    alt="Logo 1" 
                    style={{ 
                      height: 'clamp(30px, 4vw, 50px)', 
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid white'
                    }} 
                  />
                  <img 
                    src="/image_2.jpeg" 
                    alt="Logo 2" 
                    style={{ 
                      height: 'clamp(30px, 4vw, 50px)', 
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid white'
                    }} 
                  />
                  <img 
                    src="/image_3.jpeg" 
                    alt="Logo 3" 
                    style={{ 
                      height: 'clamp(30px, 4vw, 50px)', 
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid white'
                    }} 
                  />
                  <img 
                    src="/image_4.jpeg" 
                    alt="Logo 4" 
                    style={{ 
                      height: 'clamp(30px, 4vw, 50px)', 
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid white'
                    }} 
                  />
                </div>
              </div>
            </div>
          </fieldset>
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
          <div className="tui-window" style={{ width: 'var(--space-500)', maxWidth: '90vw' }}>
            <fieldset className="tui-fieldset tui-border-solid" style={{
              width: '100%',
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
            <div className="tui-window" style={{ width: 'var(--space-500)', maxWidth: '90vw' }}>
              <fieldset className="tui-fieldset tui-border-solid" style={{
                width: '100%',
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
                      style={{ backgroundColor: '#666', borderColor: '#666' }}
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
                    margin: '0 auto',
                    width: '100%'
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

                    {/* Spacer for additional spacing */}
                    <div style={{ height: '20px', width: '100%' }}></div>
                  
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
      backgroundColor: '#00f',
      padding: 'var(--space-20)'
    }}>
      {renderContent()}
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="tui-window" 
            style={{ 
              width: '400px',
              maxWidth: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <fieldset className="tui-fieldset tui-border-solid" style={{
              width: '100%',
              margin: 0,
              padding: 0
            }}>
              <legend className="center"></legend>
              <div style={{ 
                padding: 'var(--space-20)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%'
              }}>
                <AuthForm onSuccess={() => setShowAuthModal(false)} />
              </div>
            </fieldset>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#666',
        color: 'white',
        padding: 'clamp(0.25rem, 1vw, 0.5rem)',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
        zIndex: 1000
      }}>
        © {new Date().getFullYear()} Yeez Technologies Inc. All rights reserved. | Patent Pending
      </footer>
    </div>
  );
}