import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, NotificationItem } from '../../hooks/useNotifications';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'EXAM':
      return '📝';
    case 'FEE':
      return '💰';
    case 'ATTENDANCE':
      return '📅';
    case 'ANNOUNCEMENT':
      return '📢';
    case 'REMINDER':
      return '⏰';
    case 'MESSAGE':
      return '💬';
    case 'COMMENT':
      return '💡';
    case 'SYSTEM':
    default:
      return '🔔';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 60) return 'Just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

export const NotificationBellDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    setIsOpen(false);

    // Contextual navigation based on relatedType
    if (item.relatedType === 'exam' || item.type === 'EXAM') {
      navigate('/exams');
    } else if (item.relatedType === 'fee' || item.type === 'FEE') {
      navigate('/fees');
    } else if (item.relatedType === 'attendance' || item.type === 'ATTENDANCE') {
      navigate('/attendance');
    } else if (item.relatedType === 'course') {
      navigate(item.relatedId ? `/courses/${item.relatedId}` : '/courses');
    } else {
      navigate('/notifications');
    }
  };

  const previewNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2.5 transition-all duration-200 hover:bg-white/40 active:scale-95 dark:hover:bg-white/10"
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-md shadow-rose-500/30 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 z-[100] w-84 sm:w-96 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/98 shadow-2xl backdrop-blur-2xl dark:border-slate-700/80 dark:bg-slate-900/98 dark:text-white ring-1 ring-black/10 dark:ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/10 dark:divide-white/5">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading notifications...
              </div>
            ) : previewNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No new notifications.</p>
              </div>
            ) : (
              previewNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative flex cursor-pointer gap-3.5 p-4 transition-all duration-150 hover:bg-white/40 dark:hover:bg-white/5 ${
                    !item.isRead ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 text-lg shadow-sm dark:bg-slate-800/80">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm leading-tight truncate ${!item.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </p>
                    </div>
                    {item.body && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
                        {item.body}
                      </p>
                    )}
                    <span className="mt-1.5 inline-block text-[11px] text-slate-400 dark:text-slate-500">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {/* Actions (Delete button) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>

                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/20 p-3 text-center dark:border-white/10 bg-white/10 dark:bg-white/5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
