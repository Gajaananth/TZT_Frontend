import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body?: string | null;
  type: 'SYSTEM' | 'ATTENDANCE' | 'FEE' | 'EXAM' | 'MESSAGE' | 'COMMENT' | 'REMINDER' | 'ANNOUNCEMENT';
  relatedId?: string | null;
  relatedType?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export const useNotifications = (pollIntervalMs = 30000) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiClient.get('/notifications?limit=50');
      const items: NotificationItem[] = response.data?.data?.items || [];
      const count: number = response.data?.data?.unreadCount ?? items.filter(n => !n.isRead).length;
      setNotifications(items);
      setUnreadCount(count);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to fetch notifications:', err.message);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      const target = notifications.find(n => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await apiClient.delete('/notifications/delete-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to delete all notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    const interval = setInterval(fetchNotifications, pollIntervalMs);
    return () => clearInterval(interval);
  }, [user, fetchNotifications, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
