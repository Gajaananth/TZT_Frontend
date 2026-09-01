import React, { useState } from 'react';
import { Button } from '../ui/button';
import { PasswordInput } from '../ui/password-input';

interface AdminPasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title: string;
  itemName: string;
  itemType: 'student' | 'teacher' | 'user';
}

export const AdminPasswordConfirmModal: React.FC<AdminPasswordConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Incorrect administrator password or deletion failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 sm:p-8 space-y-5 rounded-2xl border border-red-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <span className="text-2xl">🗑️</span>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are about to remove <strong className="text-slate-900 dark:text-white">{itemName}</strong> from the system.
          Their access will be permanently revoked, while institutional history is archived.
        </p>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200">
          🔒 Enter your administrator password to authorize this action.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <PasswordInput
            id="admin-confirm-password"
            label="Administrator Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPassword('');
                setError(null);
                onClose();
              }}
              disabled={isSubmitting}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!password || isSubmitting}
              className="bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-40"
            >
              {isSubmitting ? 'Verifying & Removing…' : `Remove ${itemType === 'student' ? 'Student' : 'Teacher'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
