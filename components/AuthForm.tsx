'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  onSuccess: (user: { id: number; email: string }) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
        onSuccess(data.user);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="App mq--dt mq--above-sm mq--above-md mq--below-lg mq--below-xl mq--above-xs">

      <main className="view__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
        <div className="container">
          <div className="editor-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div className="editor-head">
              <div className="title-left">
                <h2 className="post-title">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
              </div>
            </div>
            
            <p className="muted" style={{ marginBottom: '2rem' }}>
              {isLogin ? 'Enter your email to access your WordPress sites' : 'Create an account to save your WordPress sites'}
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Email */}
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="input"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" style={{ display: 'block', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="input"
                  />
                  {!isLogin && (
                    <p className="muted" style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error" style={{ marginTop: '1rem' }}>
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div style={{ marginTop: '1rem', color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <div className="actions" style={{ marginTop: '2rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </div>

              {/* Toggle between login and signup */}
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
