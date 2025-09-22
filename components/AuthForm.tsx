'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TuiCheckbox } from './TuiFormElements';

interface AuthFormProps {
  onSuccess?: (user: { id: number; email: string }) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (!isLogin && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = isLogin 
        ? await login(formData.email, formData.password)
        : await signup(formData.email, formData.password);

      if (result.success) {
        setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
        // User state is already set by the login/signup functions in the hook
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({ id: 0, email: formData.email });
        }
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000); // Small delay to show success message
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  return (
    <div>
      {error && (
        <div>
          <AlertCircle className="me-2" size={20} />
          {error}
        </div>
      )}

      {success && (
        <div>
          <CheckCircle className="me-2" size={20} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset className="tui-input-fieldset">
          <legend>Email</legend>
          <input
            type="email"
            id="email"
            name="email"
            className="tui-input"
            style={{ width: '100%', minWidth: '300px' }}
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="your@email.com"
            autoComplete="email"
          />
        </fieldset>

        <fieldset className="tui-input-fieldset">
          <legend>Password</legend>
          <input
            type="password"
            id="password"
            name="password"
            className="tui-input"
            style={{ width: '100%', minWidth: '300px' }}
            value={formData.password}
            onChange={handleInputChange}
            required
            placeholder="Enter your password"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </fieldset>

        {isLogin && (
          <div style={{ marginBottom: 'var(--space-16)' }}>
            <TuiCheckbox
              id="rememberMe"
              label="Remember me"
              checked={formData.rememberMe}
              onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
            />
          </div>
        )}

        <div>
          <button
            type="submit"
            className="tui-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="me-2" size={16} />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </div>

        <div className="center">
          <button
            type="button"
            className={`tui-button ${isLogin ? 'tui-button-gray' : 'tui-button-green'}`}
            onClick={toggleMode}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
};