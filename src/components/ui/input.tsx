import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-white font-medium mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-xl border border-white/40 bg-white/40 px-4 py-3 text-slate-900 shadow-inner shadow-white/20 backdrop-blur-glass placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            dark:border-white/10 dark:bg-slate-950/30 dark:text-white dark:placeholder-slate-400
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-red-400 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
