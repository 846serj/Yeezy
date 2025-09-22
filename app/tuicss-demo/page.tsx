'use client';

import React, { useState } from 'react';
import { TuiLayout } from '@/components/TuiLayout';
import { TuiModal, TuiConfirmModal } from '@/components/TuiModal';
import { TuiCheckbox, TuiRadio, TuiTextarea, TuiSelect } from '@/components/TuiFormElements';
import { TuiPanel, TuiInfoPanel, TuiStatsPanel } from '@/components/TuiPanel';
import { TuiTabs } from '@/components/TuiTabs';

export default function TuiCssDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    checkbox1: false,
    checkbox2: true,
    radio: 'option1',
    textarea: 'This is a sample textarea content...',
    select: 'option2'
  });

  const demoTabs = [
    {
      id: 'components',
      label: 'Components',
      shortcut: 'F1',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Enhanced TuiCss Components</h4>
          <div className="tui-divider"></div>
          <p>This demo showcases all the enhanced TuiCss components we've implemented.</p>
        </div>
      )
    },
    {
      id: 'forms',
      label: 'Form Elements',
      shortcut: 'F2',
      content: (
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>Form Elements Demo</h4>
          <div className="tui-divider"></div>
          <div style={{ display: 'flex', gap: 'var(--space-20)', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: 'var(--space-200)' }}>
              <h5>Checkboxes</h5>
              <TuiCheckbox
                id="demo-checkbox1"
                label="Option 1"
                checked={formData.checkbox1}
                onChange={(checked) => setFormData({ ...formData, checkbox1: checked })}
              />
              <TuiCheckbox
                id="demo-checkbox2"
                label="Option 2 (checked)"
                checked={formData.checkbox2}
                onChange={(checked) => setFormData({ ...formData, checkbox2: checked })}
              />
            </div>
            <div style={{ flex: '1', minWidth: 'var(--space-200)' }}>
              <h5>Radio Buttons</h5>
              <TuiRadio
                id="demo-radio1"
                name="demo-radio"
                label="Option A"
                value="option1"
                checked={formData.radio === 'option1'}
                onChange={(value) => setFormData({ ...formData, radio: value })}
              />
              <TuiRadio
                id="demo-radio2"
                name="demo-radio"
                label="Option B"
                value="option2"
                checked={formData.radio === 'option2'}
                onChange={(value) => setFormData({ ...formData, radio: value })}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <TuiLayout>
      <div style={{ 
        display: 'flex', 
        height: '100%', 
        padding: 'var(--space-10)'
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: 'var(--space-1200)',
          margin: '0 auto'
        }}>
        <fieldset className="tui-fieldset tui-border-solid">
          <legend className="center">TuiCss Components Demo</legend>
          <button className="tui-button" onClick={() => window.history.back()}>
            Back
          </button>

          <div className="tui-divider"></div>

          {/* Enhanced Components Demo */}
          <div style={{ marginBottom: 'var(--space-30)' }}>
            <h3>Enhanced TuiCss Components</h3>
            <TuiTabs tabs={demoTabs} />
          </div>

          {/* Panels Demo */}
          <div style={{ marginBottom: 'var(--space-30)' }}>
            <h3>Panel Components</h3>
            <div className="container">
              <div className="row">
                <div className="col s12 m6">
                  <TuiInfoPanel
                    title="System Info"
                    items={[
                      { label: 'Version', value: '1.0.0' },
                      { label: 'Status', value: 'Online' },
                      { label: 'Uptime', value: '2h 15m' }
                    ]}
                  />
                </div>
                <div className="col s12 m6">
                  <TuiStatsPanel
                    title="Performance"
                    stats={[
                      { label: 'CPU', value: 45, color: '#00ff00' },
                      { label: 'Memory', value: 78, color: '#ffff00' },
                      { label: 'Disk', value: 23, color: '#00ffff' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Demo */}
          <div style={{ marginBottom: 'var(--space-30)' }}>
            <h3>Modal Components</h3>
            <div style={{ display: 'flex', gap: 'var(--space-10)', justifyContent: 'center' }}>
              <button 
                className="tui-button"
                onClick={() => setShowModal(true)}
              >
                <span className="tui-shortcut">M</span>Show Modal
              </button>
              <button 
                className="tui-button tui-button-red"
                onClick={() => setShowConfirm(true)}
              >
                <span className="tui-shortcut">C</span>Confirm Dialog
              </button>
            </div>
          </div>

          {/* Grid System Demo */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Grid System</legend>
              <div className="container">
                <div className="row">
                  <div className="col s12 m6 l4">
                    <div className="tui-window">
                      <fieldset className="tui-fieldset">
                        <legend>Col s12 m6 l4</legend>
                        <p>This is a responsive column that takes full width on small screens, half on medium, and one-third on large screens.</p>
                      </fieldset>
                    </div>
                  </div>
                  <div className="col s12 m6 l4">
                    <div className="tui-window">
                      <fieldset className="tui-fieldset">
                        <legend>Col s12 m6 l4</legend>
                        <p>Another responsive column with the same breakpoints.</p>
                      </fieldset>
                    </div>
                  </div>
                  <div className="col s12 m12 l4">
                    <div className="tui-window">
                      <fieldset className="tui-fieldset">
                        <legend>Col s12 m12 l4</legend>
                        <p>This column takes full width on small and medium screens, one-third on large.</p>
                      </fieldset>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Background Colors Demo */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Background Colors</legend>
              <div className="container">
                <div className="row">
                  <div className="col s6 m3">
                    <div className="tui-window tui-bg-blue-black">
                      <fieldset className="tui-fieldset">
                        <legend>Blue Black</legend>
                        <p>Blue background with black text</p>
                      </fieldset>
                    </div>
                  </div>
                  <div className="col s6 m3">
                    <div className="tui-window tui-bg-green-black">
                      <fieldset className="tui-fieldset">
                        <legend>Green Black</legend>
                        <p>Green background with black text</p>
                      </fieldset>
                    </div>
                  </div>
                  <div className="col s6 m3">
                    <div className="tui-window tui-bg-cyan-black">
                      <fieldset className="tui-fieldset">
                        <legend>Cyan Black</legend>
                        <p>Cyan background with black text</p>
                      </fieldset>
                    </div>
                  </div>
                  <div className="col s6 m3">
                    <div className="tui-window tui-bg-red-black">
                      <fieldset className="tui-fieldset">
                        <legend>Red Black</legend>
                        <p>Red background with black text</p>
                      </fieldset>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Form Elements Demo */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Form Elements</legend>
              <div className="container">
                <div className="row">
                  <div className="col s12 m6">
                    <fieldset className="tui-input-fieldset">
                      <legend>Input Fields</legend>
                      <input type="text" className="tui-input" placeholder="Text input" />
                      <input type="email" className="tui-input" placeholder="Email input" />
                      <input type="password" className="tui-input" placeholder="Password input" />
                    </fieldset>
                  </div>
                  <div className="col s12 m6">
                    <fieldset className="tui-input-fieldset">
                      <legend>Buttons</legend>
                      <button className="tui-button">Default Button</button>
                      <button className="tui-button tui-button-red">Red Button</button>
                      <button className="tui-button tui-button-green">Green Button</button>
                    </fieldset>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Table Demo */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Tables</legend>
              <table className="tui-table hovered-cyan striped-purple">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Class</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Window</td>
                    <td>tui-window</td>
                    <td>Main container for content</td>
                  </tr>
                  <tr>
                    <td>Fieldset</td>
                    <td>tui-fieldset</td>
                    <td>Grouping element with legend</td>
                  </tr>
                  <tr>
                    <td>Button</td>
                    <td>tui-button</td>
                    <td>Interactive button element</td>
                  </tr>
                  <tr>
                    <td>Input</td>
                    <td>tui-input</td>
                    <td>Text input field</td>
                  </tr>
                </tbody>
              </table>
            </fieldset>
          </div>

          {/* Progress Bar Demo */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Progress Bars</legend>
              <div className="tui-progress-bar">
                <div className="tui-progress" style={{ width: '25%' }}></div>
              </div>
              <p>25% Complete</p>
              <div className="tui-progress-bar">
                <div className="tui-progress" style={{ width: '50%' }}></div>
              </div>
              <p>50% Complete</p>
              <div className="tui-progress-bar">
                <div className="tui-progress" style={{ width: '75%' }}></div>
              </div>
              <p>75% Complete</p>
            </fieldset>
          </div>

          {/* Available Background Classes */}
          <div className="tui-window" style={{ marginTop: 'var(--space-20)' }}>
            <fieldset className="tui-fieldset">
              <legend className="center">Available Background Classes</legend>
              <ul>
                <li>• tui-bg-blue-black / tui-bg-blue-white</li>
                <li>• tui-bg-green-black / tui-bg-green-white</li>
                <li>• tui-bg-cyan-black / tui-bg-cyan-white</li>
                <li>• tui-bg-red-black / tui-bg-red-white</li>
                <li>• tui-bg-purple-black / tui-bg-purple-white</li>
                <li>• tui-bg-yellow-black / tui-bg-yellow-white</li>
                <li>• tui-bg-orange-black / tui-bg-orange-white</li>
              </ul>
            </fieldset>
          </div>
        </fieldset>
      </div>

      {/* Demo Modal */}
      <TuiModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Demo Modal"
        size="medium"
      >
        <div style={{ padding: 'var(--space-20)' }}>
          <h4>This is a TuiCss Modal</h4>
          <div className="tui-divider"></div>
          <p>This modal demonstrates the TuiCss modal component with proper DOS styling.</p>
          <br />
          <p>Features:</p>
          <ul>
            <li>• Escape key to close</li>
            <li>• Click outside to close</li>
            <li>• Proper focus management</li>
            <li>• DOS-style borders and styling</li>
          </ul>
          <div style={{ marginTop: 'var(--space-20)', textAlign: 'center' }}>
            <button 
              className="tui-button"
              onClick={() => setShowModal(false)}
            >
              Close Modal
            </button>
          </div>
        </div>
      </TuiModal>

      {/* Demo Confirm Modal */}
      <TuiConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          alert('Confirmed!');
          setShowConfirm(false);
        }}
        title="Confirm Action"
        message="Are you sure you want to perform this action? This is a demo of the TuiCss confirmation modal."
        confirmText="Yes, Do It"
        cancelText="Cancel"
        confirmButtonClass="tui-button-red"
      />
      </div>
    </TuiLayout>
  );
}