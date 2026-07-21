import { useState, useEffect } from 'react';

export type NotificationCategory = 'government' | 'community' | 'status' | 'verification' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  caseId?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-101',
    title: 'Official Dispatch Order Issued',
    message: 'Public Works Department has dispatched a repair crew for Case #CP-2026-881.',
    category: 'government',
    timestamp: '10 mins ago',
    read: false,
    caseId: 'CP-2026-881',
  },
  {
    id: 'NOTIF-102',
    title: '3 Nearby Reports Grouped',
    message: 'Your report was grouped into active community cluster #CL-62.',
    category: 'community',
    timestamp: '1 hour ago',
    read: false,
    caseId: 'CP-2026-881',
  },
  {
    id: 'NOTIF-103',
    title: 'Offline Draft Sync Completed',
    message: '2 local queued report drafts were automatically uploaded to the public ledger.',
    category: 'system',
    timestamp: 'Yesterday',
    read: true,
  },
];

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('civicpulse_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('civicpulse_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
