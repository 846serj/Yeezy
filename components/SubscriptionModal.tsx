"use client";
import React, { useState, useEffect } from 'react';

interface UsageInfo {
  canUse: boolean;
  usage: number;
  limit: number;
  planType: string;
  monthlyUsage: number;
}

interface Subscription {
  id: string;
  plan_type: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch usage info
      const usageResponse = await fetch('/api/usage', {
        credentials: 'include'
      });
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsageInfo(usageData);
      }

      // Fetch subscription info
      const subscriptionResponse = await fetch('/api/subscription', {
        credentials: 'include'
      });
      
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
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

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 10000,
        padding: 'var(--space-20)',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div 
        className="tui-window" 
        style={{ 
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          margin: '0 auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <fieldset className="tui-fieldset tui-border-solid" style={{
          width: '100%',
          margin: 0,
          padding: 0,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <legend className="center">Subscription</legend>
          <div style={{ 
            padding: 'var(--space-20)',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-16)'
          }}>
            {loading ? (
              <div className="center" style={{ padding: 'var(--space-40)' }}>
                <div className="tui-progress-bar" style={{ width: 'var(--space-300)', marginBottom: 'var(--space-20)' }}>
                  <div className="tui-progress" style={{ width: '50%' }}></div>
                </div>
                <p>Loading subscription information...</p>
              </div>
            ) : (
              <>
                {/* Current Plan */}
                {usageInfo && subscription && (
                  <div className="tui-panel tui-panel-white" style={{ marginBottom: 'var(--space-16)' }}>
                    <div className="tui-panel-header">
                      <h3>Current Plan</h3>
                      <span className={`tui-tag ${usageInfo.planType === 'premium' ? 'tui-tag-success' : 'tui-tag-info'}`}>
                        {usageInfo.planType === 'premium' ? 'Unlimited' : 'Free'}
                      </span>
                    </div>
                    <div className="tui-panel-content" style={{ padding: 'var(--space-16)' }}>
                      {usageInfo.planType === 'premium' ? (
                        <div>
                          <h4>Unlimited Tier</h4>
                          <p className="tui-text-success">✓ Unlimited image crops</p>
                          <p className="tui-text-muted">Used: {usageInfo.usage} this month</p>
                          {subscription.current_period_end && (
                            <p className="tui-text-muted">
                              Next billing: {formatDate(subscription.current_period_end)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h4>Free Tier</h4>
                          <p className="tui-text-muted">25 image crops per month</p>
                          <div className="tui-margin-top">
                            <div className="tui-progress-bar" style={{ marginBottom: 'var(--space-8)' }}>
                              <div 
                                className="tui-progress-bar-fill"
                                style={{ 
                                  width: `${Math.min((usageInfo.usage / 25) * 100, 100)}%`,
                                  backgroundColor: (usageInfo.usage / 25) > 0.8 ? '#ff6b6b' : '#4ecdc4'
                                }}
                              ></div>
                            </div>
                            <p className="tui-text-muted">
                              {usageInfo.usage} / 25 crops used this month
                            </p>
                            {usageInfo.usage >= 25 && (
                              <p className="tui-text-error">⚠️ Monthly limit reached</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {usageInfo && subscription && (
                  <div className="tui-panel tui-panel-white" style={{ marginBottom: 'var(--space-16)' }}>
                    <div className="tui-panel-content" style={{ padding: 'var(--space-16)' }}>
                      {usageInfo.planType === 'free' ? (
                        <div>
                          <button 
                            className="tui-button tui-button-success"
                            onClick={handleUpgrade}
                            style={{ 
                              width: '100%',
                              padding: 'var(--space-12) var(--space-16)',
                              fontSize: 'var(--space-14)',
                              fontWeight: 'bold'
                            }}
                          >
                            Upgrade to Unlimited - $20/month
                          </button>
                          <div className="tui-margin-top">
                            <h4>Unlimited Benefits:</h4>
                            <ul className="tui-list">
                              <li>✓ Unlimited image crops</li>
                              <li>✓ No monthly limits</li>
                              <li>✓ Priority support</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="tui-button tui-button-info"
                          onClick={handleManageSubscription}
                          style={{ 
                            width: '100%',
                            padding: 'var(--space-12) var(--space-16)',
                            fontSize: 'var(--space-14)',
                            fontWeight: 'bold'
                          }}
                        >
                          Manage Subscription
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 'var(--space-20)',
                  paddingTop: 'var(--space-16)',
                  borderTop: '1px solid #ddd'
                }}>
                  <button 
                    className="tui-button"
                    onClick={onClose}
                    style={{ 
                      backgroundColor: '#666', 
                      borderColor: '#666',
                      minWidth: '120px'
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </fieldset>
      </div>
    </div>
  );
};

export default SubscriptionModal;
