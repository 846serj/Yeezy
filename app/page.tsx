'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

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
      backgroundColor: '#c0c0c0'
    }}>
      <div className="tui-window">
        <fieldset className="tui-fieldset">
          <legend className="center">Redirecting...</legend>
          <div className="center" style={{ padding: 'var(--space-40)' }}>
            <p>Redirecting to dashboard...</p>
          </div>
        </fieldset>
      </div>
    </div>
  );
}