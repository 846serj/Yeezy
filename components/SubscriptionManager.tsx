"use client";
import React, { useState, useEffect } from 'react';

interface Subscription {
  id: string;
  plan_type: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'past_due';
  current_period_start?: string;
  current_period_end?: string;
  stripe_customer_id?: string;
}

const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
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

  if (loading) {
    return (
      <div className="tui-panel tui-panel-white">
        <div className="tui-panel-header">
          <h3>Subscription</h3>
        </div>
        <div className="tui-panel-content">
          <p>Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="tui-panel tui-panel-white">
        <div className="tui-panel-header">
          <h3>Subscription</h3>
        </div>
        <div className="tui-panel-content">
          <p>Unable to load subscription information</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'tui-tag-success';
      case 'cancelled': return 'tui-tag-error';
      case 'past_due': return 'tui-tag-warning';
      default: return 'tui-tag-info';
    }
  };

  return (
    <div className="tui-panel tui-panel-white">
      <div className="tui-panel-header">
        <h3>Subscription</h3>
        <span className={`tui-tag ${getStatusColor(subscription.status)}`}>
          {subscription.status}
        </span>
      </div>
      <div className="tui-panel-content">
        <div className="tui-margin-bottom">
          <h4>Current Plan: {subscription.plan_type === 'premium' ? 'Premium' : 'Free'}</h4>
          {subscription.plan_type === 'premium' && (
            <p className="tui-text-muted">$20/month - Unlimited image crops</p>
          )}
          {subscription.plan_type === 'free' && (
            <p className="tui-text-muted">25 image crops per month</p>
          )}
        </div>

        {subscription.plan_type === 'premium' && subscription.current_period_end && (
          <div className="tui-margin-bottom">
            <p className="tui-text-muted">
              Next billing date: {formatDate(subscription.current_period_end)}
            </p>
          </div>
        )}

        <div className="tui-margin-top">
          {subscription.plan_type === 'free' ? (
            <button 
              className="tui-button tui-button-success"
              onClick={handleUpgrade}
            >
              Upgrade to Premium
            </button>
          ) : (
            <button 
              className="tui-button tui-button-info"
              onClick={handleManageSubscription}
            >
              Manage Subscription
            </button>
          )}
        </div>

        {subscription.plan_type === 'free' && (
          <div className="tui-margin-top">
            <h4>Premium Benefits:</h4>
            <ul className="tui-list">
              <li>✓ Unlimited image crops</li>
              <li>✓ Priority support</li>
              <li>✓ Advanced features</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;

