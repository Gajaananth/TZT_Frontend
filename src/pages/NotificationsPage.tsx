import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '../components/layout/BaseLayout';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { useNotifications, NotificationItem } from '../hooks/useNotifications';

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

const formatFullDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'EXAM' | 'FEE' | 'ATTENDANCE' | 'SYSTEM'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
  } = useNotifications();

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'UNREAD' && item.isRead) return false;
    if (activeFilter !== 'ALL' && activeFilter !== 'UNREAD' && item.type !== activeFilter) return false;
    if (searchTerm) {
      const matchTitle = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBody = item.body?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTitle || matchBody;
    }
    return true;
  });

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    // Contextual navigation
    if (item.relatedType === 'exam' || item.type === 'EXAM') {
      navigate('/exams');
    } else if (item.relatedType === 'fee' || item.type === 'FEE') {
      navigate('/fees');
    } else if (item.relatedType === 'attendance' || item.type === 'ATTENDANCE') {
      navigate('/attendance');
    } else if (item.relatedType === 'course') {
      navigate(item.relatedId ? `/courses/${item.relatedId}` : '/courses');
    }
  };

  return (
    <BaseLayout>
      <div className="space-y-6 bg-transparent p-5 md:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Manage your alerts, course updates, exam announcements, and fee notices.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={refresh}
              className="bg-white/40 text-slate-800 hover:bg-white/80 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 text-sm"
            >
              🔄 Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} className="text-sm">
                ✓ Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all notifications?')) {
                    deleteAllNotifications();
                  }
                }}
                className="bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:text-red-300 text-sm"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="glass flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'All', count: notifications.length },
              { key: 'UNREAD', label: 'Unread', count: unreadCount },
              { key: 'EXAM', label: 'Exams' },
              { key: 'FEE', label: 'Fees' },
              { key: 'ATTENDANCE', label: 'Attendance' },
              { key: 'SYSTEM', label: 'System' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white/30 text-slate-600 hover:bg-white/60 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full md:w-72">
            <input
              type="search"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-white/40 bg-white/40 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-white/10 dark:bg-slate-950/30 dark:text-white dark:placeholder-slate-400"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="glass overflow-hidden divide-y divide-white/15 dark:divide-white/5">
          {isLoading && notifications.length === 0 ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">🔔</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No notifications found</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? 'No notifications match your search query.'
                  : activeFilter === 'UNREAD'
                  ? 'You have read all of your notifications!'
                  : 'You do not have any notifications in this category yet.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group flex items-start justify-between gap-4 p-5 transition-all duration-150 hover:bg-white/40 dark:hover:bg-white/5 cursor-pointer ${
                  !item.isRead ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : ''
                }`}
              >
                {/* Left side: Icon & Text */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 text-xl shadow-sm dark:bg-slate-800">
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-base leading-tight ${!item.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {item.type}
                      </span>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                      )}
                    </div>

                    {item.body && (
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.body}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {formatFullDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                      className="rounded-lg p-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400"
                      title="Mark as read"
                    >
                      ✓ Read
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    title="Delete notification"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </BaseLayout>
  );
};
