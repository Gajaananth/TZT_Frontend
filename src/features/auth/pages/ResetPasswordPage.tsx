import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { PasswordInput } from '../../../components/ui/password-input';
import { Footer } from '../../../components/layout/Footer';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => searchParams.get('token') || searchParams.get('access_token') || '', [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('Missing password reset token.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/auth/password-reset-confirm', { token, password });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell flex min-h-screen flex-col justify-between">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass p-8 sm:p-10">
            <div className="mb-8 flex justify-center">
              <img src="/logo.png" alt="TZIT Education Logo" className="h-16 w-auto" />
            </div>

            <h1 className="mb-2 text-center text-3xl font-bold text-slate-950 dark:text-white">Reset Password</h1>
            <p className="mb-8 text-center text-slate-600 dark:text-slate-300">Choose a new password for your TZIT account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              <PasswordInput
                id="password"
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <PasswordInput
                id="confirmPassword"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" disabled={isSubmitting} className="w-full text-white">
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
