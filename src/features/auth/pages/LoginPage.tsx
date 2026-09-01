import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PasswordInput } from '../../../components/ui/password-input';
import { Spinner } from '../../../components/ui/spinner';
import { Footer } from '../../../components/layout/Footer';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setFormError('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen flex-col justify-between">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass p-8 sm:p-10">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="/logo.png" alt="TZIT Education Logo" className="h-16 w-auto" />
            </div>

            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">TZIT Education</p>
            <h1 className="mb-2 text-center text-3xl font-bold text-slate-950 dark:text-white">Welcome Back</h1>
            <p className="mb-8 text-center text-slate-600 dark:text-slate-300">
              Sign in to TZIT Education ERP
            </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(formError || error) && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-4">
                <p className="text-sm text-red-700 dark:text-red-200">{formError || error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <PasswordInput
                id="password"
                name="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 py-3 font-semibold"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Link to="/reset-password" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
              Forgot password?
            </Link>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
                Register here
              </Link>
            </p>
          </div>

        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};
