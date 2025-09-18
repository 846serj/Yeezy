'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteSelector } from '@/components/SiteSelector';
import { SiteList } from '@/components/SiteList';
import { AuthForm } from '@/components/AuthForm';
import { useWordPress } from '@/hooks/useWordPress';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { isConnected, connect } = useWordPress();
  const [currentView, setCurrentView] = useState<'sites' | 'add-site'>('sites');

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (!authLoading && isAuthenticated && isConnected) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, isConnected, router]);

  const handleConnect = async (siteUrl: string, username: string, appPassword: string) => {
    const success = await connect(siteUrl, username, appPassword);
    if (success) {
      router.push('/dashboard');
    }
    return success;
  };

  const handleAddNewSite = () => {
    setCurrentView('sites');
  };


  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  // Show site selection if not connected to WordPress
  if (!isConnected) {
    if (currentView === 'add-site') {
      return <SiteSelector onConnect={handleConnect} onBack={() => setCurrentView('sites')} />;
    }
    
    // Show site list with main page structure
    return (
      <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">
        <main className="view__inner">
          <div className="maxWidth maxWidth--content hSpace hSpace--content">
            <div className="editor-card">
              <SiteList onConnect={handleConnect} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // This should not render if connected (will redirect to dashboard)
  return null;
}
