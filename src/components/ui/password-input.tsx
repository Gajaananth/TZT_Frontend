import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            className={`
              w-full rounded-xl border border-white/40 bg-white/40 px-4 py-3 pr-12 text-slate-900 shadow-inner shadow-white/20 backdrop-blur-glass placeholder-slate-500
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:border-white/10 dark:bg-slate-950/30 dark:text-white dark:placeholder-slate-400
              ${error ? 'border-red-500 focus:ring-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible(v => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors"
          >
            {visible ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
