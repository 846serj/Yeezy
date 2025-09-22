'use client';

import React, { useState } from 'react';
import { TuiSettingsTabs, TuiHelpTabs } from '@/components/TuiTabs';
import { TuiModal, TuiConfirmModal } from '@/components/TuiModal';
import { TuiCheckbox, TuiSelect, TuiTextarea } from '@/components/TuiFormElements';
import { TuiLayout } from '@/components/TuiLayout';

export default function Settings() {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [settings, setSettings] = useState({
    defaultSite: '',
    theme: 'dos-classic',
    autoSave: true,
    debugMode: false,
    notifications: true,
    email: '',
    bio: ''
  });

  const handleResetSettings = () => {
    setSettings({
      defaultSite: '',
      theme: 'dos-classic',
      autoSave: true,
      debugMode: false,
      notifications: true,
      email: '',
      bio: ''
    });
    setShowConfirmReset(false);
  };

  const handleSaveSettings = () => {
    // Save settings logic here
    
  };

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
          <legend className="center">Settings</legend>
          <div style={{ 
            padding: '0 var(--space-20) var(--space-20) var(--space-20)',
            height: 'calc(100vh - var(--space-80))',
            overflow: 'auto',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
          {/* Sidebar */}
          <div style={{
            width: 'var(--space-200)',
            minWidth: 'var(--space-200)',
            marginRight: 'var(--space-4)',
            flexShrink: 0,
            padding: 'var(--space-4)'
          }}>
            <div className="tui-window tui-border-solid" style={{ height: '100%' }}>
              <fieldset className="tui-fieldset">
                <legend className="center">Menu</legend>
                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">H</span>ome
                      <span className="tui-shortcut">F1</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/dashboard" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">D</span>ashboard
                      <span className="tui-shortcut">F2</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/editor" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">E</span>ditor
                      <span className="tui-shortcut">F3</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/generate" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">G</span>enerate
                      <span className="tui-shortcut">F4</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-8)' }}>
                    <div className="tui-black-divider"></div>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="/settings" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">S</span>ettings
                      <span className="tui-shortcut">F5</span>
                    </a>
                  </li>
                </ul>
              </fieldset>
            </div>
          </div>

          {/* Main Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            padding: 'var(--space-4)',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              height: '100%', 
              gap: 'var(--space-10)'
            }}>
              {/* Settings Section */}
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="tui-window" style={{ height: '100%' }}>
                  <fieldset className="tui-fieldset tui-border-solid" style={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0
                  }}>
                    <legend className="center">Settings</legend>
                    <button 
                      className="tui-button" 
                      onClick={() => window.history.back()}
                    >
                      &lt;
                    </button>
                    <TuiSettingsTabs />
                  </fieldset>
                </div>
              </div>

              {/* Help Section */}
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="tui-window" style={{ height: '100%' }}>
                  <fieldset className="tui-fieldset tui-border-solid" style={{
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0
                  }}>
                    <legend className="center">Help & Documentation</legend>
                    <TuiHelpTabs />
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="tui-statusbar" style={{
          height: 'var(--space-20)',
          backgroundColor: '#c0c0c0',
          borderTop: 'var(--space-1) solid #808080',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 var(--space-8)',
          fontSize: 'var(--space-11)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-10)' }}>
            <span><span className="red-255-text">F1</span> Help</span>
            <span><span className="red-255-text">F2</span> Connect</span>
            <span><span className="red-255-text">F3</span> Refresh</span>
            <span>|</span>
            <span><span className="red-255-text">F10</span> Menu</span>
          </div>
          <div>Settings - WordPress Article Editor v1.0 - Ready</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: 'var(--space-40)', 
        right: 'var(--space-20)',
        display: 'flex', 
        gap: 'var(--space-10)',
        zIndex: 10000
      }}>
        <button 
          className="tui-button tui-button-green"
          onClick={handleSaveSettings}
        >
          <span className="tui-shortcut">S</span>Save
        </button>
        <button 
          className="tui-button"
          onClick={() => setShowAbout(true)}
        >
          <span className="tui-shortcut">A</span>About
        </button>
        <button 
          className="tui-button tui-button-red"
          onClick={() => setShowConfirmReset(true)}
        >
          <span className="tui-shortcut">R</span>Reset
        </button>
      </div>

      {/* About Modal */}
      <TuiModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        title="About WordPress Article Editor"
        size="medium"
      >
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>WordPress Article Editor v1.0</h4>
          <div className="tui-divider"></div>
          <p>A DOS-style text-based interface for editing WordPress articles.</p>
          <br />
          <p><strong>Features:</strong></p>
          <ul>
            <li>• Connect to multiple WordPress sites</li>
            <li>• Create and edit articles with a DOS-style interface</li>
            <li>• AI-powered content generation</li>
            <li>• Keyboard shortcuts for efficiency</li>
            <li>• Built with TuiCss framework</li>
          </ul>
          <br />
          <p><strong>Built with:</strong> Next.js, React, TuiCss, TypeScript</p>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
