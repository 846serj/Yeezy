'use client';

import React, { useState } from 'react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  shortcut?: string;
}

interface TuiTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export const TuiTabs: React.FC<TuiTabsProps> = ({
  tabs,
  defaultTab,
  className = '',
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      setActiveTab(tabId);
      onTabChange?.(tabId);
    }
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`tui-tabs ${className}`}>
      {/* Tab Headers */}
      <div className="tui-tabs-header">
        <ul className="tui-tabs-list">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              className={`tui-tab-item ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <a href="#!" onClick={(e) => e.preventDefault()}>
                {tab.shortcut && <span className="tui-shortcut">{tab.shortcut}</span>}
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tui-tabs-content">
        <div className="tui-window tui-border-solid">
          <fieldset className="tui-fieldset">
            <legend className="center">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </legend>
            <div className="tui-tab-panel">
              {activeTabContent}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
};

// Settings Tabs Component
export const TuiSettingsTabs: React.FC<{ className?: string }> = ({ className = '' }) => {
  const settingsTabs: TabItem[] = [
    {
      id: 'general',
      label: 'General',
      shortcut: 'F1',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>General Settings</h4>
          <div className="tui-divider"></div>
          <p>Configure general application settings here.</p>
          <div style={{ marginTop: 'var(--space-20)' }}>
            <label>Default Site:</label>
            <select className="tui-select" style={{ marginLeft: 'var(--space-10)' }}>
              <option>Select a site...</option>
              <option>My WordPress Site</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'appearance',
      label: 'Appearance',
      shortcut: 'F2',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Appearance Settings</h4>
          <div className="tui-divider"></div>
          <p>Customize the appearance of your interface.</p>
          <div style={{ marginTop: 'var(--space-20)' }}>
            <label>Theme:</label>
            <select className="tui-select" style={{ marginLeft: 'var(--space-10)' }}>
              <option>DOS Classic</option>
              <option>DOS Enhanced</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'advanced',
      label: 'Advanced',
      shortcut: 'F3',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Advanced Settings</h4>
          <div className="tui-divider"></div>
          <p>Advanced configuration options.</p>
          <div style={{ marginTop: 'var(--space-20)' }}>
            <label>Debug Mode:</label>
            <input type="checkbox" className="tui-checkbox" style={{ marginLeft: 'var(--space-10)' }} />
          </div>
        </div>
      )
    }
  ];

  return <TuiTabs tabs={settingsTabs} className={className} />;
};

// Help Tabs Component
export const TuiHelpTabs: React.FC<{ className?: string }> = ({ className = '' }) => {
  const helpTabs: TabItem[] = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      shortcut: 'F1',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Getting Started</h4>
          <div className="tui-divider"></div>
          <p>Welcome to the WordPress Article Editor!</p>
          <ul>
            <li>• Connect to your WordPress site</li>
            <li>• Create and edit articles</li>
            <li>• Use keyboard shortcuts for efficiency</li>
            <li>• Generate content with AI assistance</li>
          </ul>
        </div>
      )
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      shortcut: 'F2',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Keyboard Shortcuts</h4>
          <div className="tui-divider"></div>
          <table className="tui-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>F1</td><td>Help</td></tr>
              <tr><td>F2</td><td>Connect Site</td></tr>
              <tr><td>F3</td><td>Refresh</td></tr>
              <tr><td>F4</td><td>Generate</td></tr>
              <tr><td>Esc</td><td>Close/Cancel</td></tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      label: 'Troubleshooting',
      shortcut: 'F3',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Troubleshooting</h4>
          <div className="tui-divider"></div>
          <p>Common issues and solutions:</p>
          <ul>
            <li>• Connection issues: Check your site URL and credentials</li>
            <li>• Authentication: Ensure your app password is correct</li>
            <li>• Loading problems: Try refreshing the page</li>
          </ul>
        </div>
      )
    }
  ];

  return <TuiTabs tabs={helpTabs} className={className} />;
};
