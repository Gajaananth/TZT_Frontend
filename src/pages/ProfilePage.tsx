import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { PasswordInput } from '../components/ui/password-input';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const roleName = user?.userRoles?.[0]?.role?.name || 'User';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMsg(null);

    try {
      await apiClient.post('/auth/change-password', { oldPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.delete('/auth/delete-account', {
        data: { confirmation: 'DELETE' },
      });
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <BaseLayout>
      <div className="mx-auto max-w-4xl space-y-8 bg-transparent p-5 md:p-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your personal profile, credentials, and account lifecycle.
          </p>
        </div>

        {/* Profile Details Card */}
        <div className="glass p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 border-b border-white/20 pb-6 dark:border-white/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {roleName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-white/30 bg-white/20 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account ID</span>
              <p className="mt-1 font-mono text-slate-800 dark:text-slate-200">{user?.id}</p>
            </div>
            <div className="rounded-xl border border-white/30 bg-white/20 p-4 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">● Active</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ensure your account uses a secure password with at least 8 characters.
          </p>

          {passwordMsg && (
            <div className={`rounded-xl border p-4 text-sm ${
              passwordMsg.type === 'success'
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300'
            }`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <PasswordInput
              id="new-password"
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <PasswordInput
              id="confirm-new-password"
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={isChangingPassword} className="w-fit text-sm">
              {isChangingPassword ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 sm:p-8 dark:border-red-500/20 dark:bg-red-950/20 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Permanently delete your login account and revoke your access credentials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-red-500/20 pt-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Delete this account</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your login will be permanently disabled. Educational, attendance, and exam audit records are archived.
              </p>
            </div>

            <Button
              id="delete-account-trigger-btn"
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 text-white hover:bg-red-700 text-sm whitespace-nowrap"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="glass w-full max-w-md p-6 sm:p-8 space-y-5 rounded-2xl border border-red-500/30 shadow-2xl">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-xl font-bold">Confirm Account Deletion</h3>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                This action is irreversible. You will immediately be signed out and unable to log in again.
              </p>

              <div className="rounded-xl border border-white/20 bg-white/20 p-3.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                Type <strong className="font-mono text-red-600 dark:text-red-400">DELETE</strong> below to confirm.
              </div>

              {deleteError && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200">
                  {deleteError}
                </div>
              )}

              <input
                id="delete-confirm-input"
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full rounded-xl border border-red-400/40 bg-white/50 px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-500/30 dark:bg-slate-900/50 dark:text-white"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  id="delete-confirm-submit-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-40"
                >
                  {isDeleting ? 'Deleting…' : 'Permanently Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};
