import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';

export const Topbar: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex] ?? 'auto';
    setTheme(nextTheme);
  };

  return (
    <div className="glass m-3 mb-0 flex items-center justify-between rounded-2xl px-4 py-3 md:px-6">
      {/* Left side - Logo and Search */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        {/* Logo */}
        <div className="h-10 w-auto flex-shrink-0">
          <img src="/logo.png" alt="TZIT Logo" className="h-full w-auto" />
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search students, courses, fees..."
          className="w-full rounded-xl border border-white/30 bg-white/35 px-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-slate-950/30 dark:text-white dark:placeholder-slate-400"
        />
      </div>

      {/* Right side - Icons and Profile */}
      <div className="flex items-center gap-6 ml-6">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="rounded-xl p-2 transition-colors hover:bg-white/40 dark:hover:bg-white/10"
          title={`Theme: ${theme}`}
        >
          {isDark ? '🌙' : '☀️'}
        </button>

        {/* Notifications */}
        <NotificationBellDropdown />

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-white/40 dark:hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-semibold text-white">
              {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.firstName}
            </span>
            <span className="text-gray-500">▼</span>
          </button>

          {showProfileMenu && (
            <div className="glass absolute right-0 z-50 mt-2 w-56 p-2">
              <div className="border-b border-white/30 p-3 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                >
                  <span>⚙️</span>
                  <span>Account Settings</span>
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border-t border-white/20 dark:border-white/10 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
