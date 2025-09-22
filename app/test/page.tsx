'use client';

import React from 'react';

export default function TestPage() {
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
      zIndex: 9999
    }}>
      <div className="tui-window" style={{
        width: '100%',
        height: '100%',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--space-48)',
        fontWeight: 'bold'
      }}>
        <fieldset className="tui-fieldset tui-border-solid" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none'
        }}>
          <legend className="center" style={{
            fontSize: 'var(--space-24)',
            padding: '0 var(--space-20)',
            backgroundColor: '#0000a8',
            color: '#fff'
          }}>
            Yeez.ai
          </legend>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: 'var(--space-72)',
            fontWeight: 'bold',
            color: '#0000a8'
          }}>
            yeez
          </div>
        </fieldset>
      </div>
    </div>
  );
}
