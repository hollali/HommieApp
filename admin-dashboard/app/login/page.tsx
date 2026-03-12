'use client';

import { useState, useEffect } from 'react';
import { mockLogin, initializeMockData } from '@/lib/mockData';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function AdminLoginPage() {
  return <MockAdminLoginPage />;
}

function MockAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize mock data on component mount
  useEffect(() => {
    try {
      initializeMockData();
    } catch (error) {
      console.error('Failed to initialize mock data:', error);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Mock login (demo mode)
      const admin = mockLogin(email.trim(), password);

      if (admin) {
        // Small delay to ensure localStorage is set
        await new Promise(resolve => setTimeout(resolve, 100));
        // Use window.location for more reliable navigation
        window.location.href = '/dashboard';
      } else {
        setError('Invalid email or password.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const message = String(err?.message || '');
      
      // Check for common error patterns
      if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('does not exist')) {
        setError('No account found with this email. Please check your email or sign up first.');
        return;
      }
      
      if (message.toLowerCase().includes('password') || message.toLowerCase().includes('incorrect')) {
        setError('Incorrect email or password. Please try again.');
        return;
      }
      
      if (message.toLowerCase().includes('verification') || message.toLowerCase().includes('verify')) {
        setError('Please verify your email address before signing in. Check your inbox for a verification link.');
        return;
      }
      
      // Generic error fallback
      setError(message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 mt-24">
          <div className="mb-6 flex justify-center">
            <Logo size="large" />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-surface rounded-3xl shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-2xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-secondary text-center">
              Secure admin access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
