'use client';

import React, { useState } from 'react';
import { TuiModal, TuiConfirmModal } from '@/components/TuiModal';
import { TuiCheckbox, TuiRadio, TuiTextarea, TuiSelect } from '@/components/TuiFormElements';
import { TuiTabs } from '@/components/TuiTabs';
import { TuiPanel, TuiInfoPanel, TuiStatsPanel } from '@/components/TuiPanel';
import { TuiLayout } from '@/components/TuiLayout';

export default function ExamplePage() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('option1');

  const tabs = [
    { id: 'tab1', label: 'Components', content: 'Component examples' },
    { id: 'tab2', label: 'Forms', content: 'Form elements' },
    { id: 'tab3', label: 'Tables', content: 'Table examples' },
    { id: 'tab4', label: 'Panels', content: 'Panel examples' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      padding: 'var(--space-4)',
      backgroundColor: '#c0c0c0'
    }}>
      {/* Main Application Window */}
      <div className="tui-window" style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Title Bar */}
        <div className="tui-window-title" style={{
          height: 'var(--space-20)',
          lineHeight: 'var(--space-18)',
          padding: '0 var(--space-8)',
          backgroundColor: '#c0c0c0',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'var(--space-2) solid #000',
          fontSize: 'var(--space-12)',
          fontWeight: 'bold',
          flexShrink: 0
        }}>
          <span>TuiCss Example Application</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="tui-window-button" style={{
              width: 'var(--space-16)',
              height: 'var(--space-14)',
              border: 'var(--space-1) solid #000',
              backgroundColor: '#c0c0c0',
              color: '#000',
              fontSize: 'var(--space-10)',
              cursor: 'pointer'
            }}>_</button>
            <button className="tui-window-button" style={{
              width: 'var(--space-16)',
              height: 'var(--space-14)',
              border: 'var(--space-1) solid #000',
              backgroundColor: '#c0c0c0',
              color: '#000',
              fontSize: 'var(--space-10)',
              cursor: 'pointer'
            }}>□</button>
            <button className="tui-window-button" style={{
              width: 'var(--space-16)',
              height: 'var(--space-14)',
              border: 'var(--space-1) solid #000',
              backgroundColor: '#c0c0c0',
              color: '#000',
              fontSize: 'var(--space-10)',
              cursor: 'pointer'
            }}>×</button>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="tui-menu-bar" style={{
          height: 'var(--space-22)',
          backgroundColor: '#c0c0c0',
          borderBottom: 'var(--space-1) solid #808080',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-4)',
          fontSize: 'var(--space-11)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-15)' }}>
            <span style={{ fontWeight: 'bold' }}>File</span>
            <span style={{ fontWeight: 'bold' }}>Edit</span>
            <span style={{ fontWeight: 'bold' }}>View</span>
            <span style={{ fontWeight: 'bold' }}>Tools</span>
            <span style={{ fontWeight: 'bold' }}>Help</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
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
                    <a href="#" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">H</span>ome
                      <span className="tui-shortcut">F1</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="#" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">D</span>ashboard
                      <span className="tui-shortcut">F2</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="#" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
                      <span className="red-255-text">E</span>ditor
                      <span className="tui-shortcut">F3</span>
                    </a>
                  </li>
                  <li style={{ marginBottom: 'var(--space-8)' }}>
                    <div className="tui-black-divider"></div>
                  </li>
                  <li style={{ marginBottom: 'var(--space-2)' }}>
                    <a href="#" style={{ display: 'block', padding: 'var(--space-4) var(--space-8)', textDecoration: 'none' }}>
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
            {/* Tabs */}
            <div style={{ marginBottom: 'var(--space-10)' }}>
              <TuiTabs tabs={tabs} />
            </div>

            {/* Content Grid */}
            <div style={{ display: 'flex', gap: 'var(--space-10)', flex: 1 }}>
              {/* Left Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
                {/* Form Elements */}
                <div className="tui-window tui-border-solid">
                  <fieldset className="tui-fieldset">
                    <legend className="center">Form Elements</legend>
                    <div style={{ padding: 'var(--space-10)' }}>
                      <div style={{ marginBottom: 'var(--space-10)' }}>
                        <TuiCheckbox
                          id="test-checkbox"
                          label="Enable Feature"
                          checked={checkboxValue}
                          onChange={setCheckboxValue}
                        />
                      </div>
                      <div style={{ marginBottom: 'var(--space-10)' }}>
                        <TuiRadio
                          id="radio1"
                          name="test-radio"
                          label="Option 1"
                          value="option1"
                          checked={radioValue === 'option1'}
                          onChange={setRadioValue}
                        />
                        <TuiRadio
                          id="radio2"
                          name="test-radio"
                          label="Option 2"
                          value="option2"
                          checked={radioValue === 'option2'}
                          onChange={setRadioValue}
                        />
                      </div>
                      <div style={{ marginBottom: 'var(--space-10)' }}>
                        <TuiTextarea
                          value={textareaValue}
                          onChange={setTextareaValue}
                          placeholder="Enter text here..."
                          rows={3}
                        />
                      </div>
                      <div style={{ marginBottom: 'var(--space-10)' }}>
                        <TuiSelect
                          value={selectValue}
                          onChange={setSelectValue}
                          options={[
                            { value: 'option1', label: 'Option 1' },
                            { value: 'option2', label: 'Option 2' },
                            { value: 'option3', label: 'Option 3' }
                          ]}
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Buttons */}
                <div className="tui-window tui-border-solid">
                  <fieldset className="tui-fieldset">
                    <legend className="center">Buttons</legend>
                    <div style={{ padding: 'var(--space-10)', display: 'flex', gap: 'var(--space-10)', flexWrap: 'wrap' }}>
                      <button className="tui-button">Default</button>
                      <button className="tui-button tui-button-red">Red</button>
                      <button className="tui-button tui-button-green">Green</button>
                      <button className="tui-button" onClick={() => setShowModal(true)}>Modal</button>
                      <button className="tui-button tui-button-red" onClick={() => setShowConfirm(true)}>Confirm</button>
                    </div>
                  </fieldset>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
                {/* Table */}
                <div className="tui-window tui-border-solid">
                  <fieldset className="tui-fieldset">
                    <legend className="center">Data Table</legend>
                    <table className="tui-table hovered-cyan striped-purple tui-border-double">
                      <thead className="tui-border-double">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>Item One</td>
                          <td><span className="success">Active</span></td>
                          <td><button className="tui-button">Edit</button></td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>Item Two</td>
                          <td><span className="warning">Pending</span></td>
                          <td><button className="tui-button">Edit</button></td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>Item Three</td>
                          <td><span className="danger">Inactive</span></td>
                          <td><button className="tui-button">Edit</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </fieldset>
                </div>

                {/* Panels */}
                <div style={{ display: 'flex', gap: 'var(--space-10)' }}>
                  <TuiInfoPanel
                    title="System Info"
                    items={[
                      { label: 'Version', value: '1.0.0' },
                      { label: 'Status', value: 'Online' },
                      { label: 'Uptime', value: '2h 15m' }
                    ]}
                  />
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
            <span><span className="red-255-text">F2</span> Menu</span>
            <span><span className="red-255-text">F3</span> View</span>
            <span>|</span>
            <span><span className="red-255-text">F10</span> Exit</span>
          </div>
          <div>TuiCss Example Application v1.0 - Ready</div>
        </div>
      </div>

      {/* Modals */}
      <TuiModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
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
            <button className="tui-button" onClick={() => setShowModal(false)}>
              Close Modal
            </button>
          </div>
        </div>
      </TuiModal>

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
  );
}
