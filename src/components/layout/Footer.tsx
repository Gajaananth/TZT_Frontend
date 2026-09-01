import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      <p>
        © {new Date().getFullYear()} TZIT Education ERP + LMS. All rights reserved and developed by{' '}
        <span className="font-semibold text-slate-900 dark:text-slate-100">Tradiq Zium Techs</span>
      </p>
    </footer>
  );
};
