"use client";
import React, { useState, useEffect } from 'react';

interface UsageInfo {
  canUse: boolean;
  usage: number;
  limit: number;
  planType: string;
  monthlyUsage: number;
}

const UsageDisplay: React.FC = () => {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageInfo();
  }, []);

  const fetchUsageInfo = async () => {
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data);
      }
    } catch (error) {
      console.error('Error fetching usage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div className="tui-panel tui-panel-white">
        <div className="tui-panel-header">
          <h3>Usage</h3>
        </div>
        <div className="tui-panel-content">
          <p>Loading usage information...</p>
        </div>
      </div>
    );
  }

  if (!usageInfo) {
    return (
      <div className="tui-panel tui-panel-white">
        <div className="tui-panel-header">
          <h3>Usage</h3>
        </div>
        <div className="tui-panel-content">
          <p>Unable to load usage information</p>
        </div>
      </div>
    );
  }

  const isUnlimited = usageInfo.limit === -1;
  const usagePercentage = isUnlimited ? 0 : (usageInfo.usage / usageInfo.limit) * 100;

  return (
    <div className="tui-panel tui-panel-white">
      <div className="tui-panel-header">
        <h3>Image Usage</h3>
        <span className={`tui-tag ${usageInfo.planType === 'premium' ? 'tui-tag-success' : 'tui-tag-info'}`}>
          {usageInfo.planType === 'premium' ? 'Premium' : 'Free'}
        </span>
      </div>
      <div className="tui-panel-content">
        {isUnlimited ? (
          <div>
            <p className="tui-text-success">✓ Unlimited image crops</p>
            <p className="tui-text-muted">Used: {usageInfo.usage} this month</p>
          </div>
        ) : (
          <div>
            <div className="tui-progress-bar">
              <div 
                className="tui-progress-bar-fill"
                style={{ 
                  width: `${Math.min(usagePercentage, 100)}%`,
                  backgroundColor: usagePercentage > 80 ? '#ff6b6b' : '#4ecdc4'
                }}
              ></div>
            </div>
            <p className="tui-text-muted">
              {usageInfo.usage} / {usageInfo.limit} crops used this month
            </p>
            {!usageInfo.canUse && (
              <p className="tui-text-error">⚠️ Monthly limit reached</p>
            )}
          </div>
        )}
        
        {usageInfo.planType === 'free' && (
          <div className="tui-margin-top">
            <button 
              className="tui-button tui-button-success"
              onClick={handleUpgrade}
            >
              Upgrade to Premium - $20/month
            </button>
            <p className="tui-text-muted tui-text-small">
              Get unlimited image crops
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageDisplay;
