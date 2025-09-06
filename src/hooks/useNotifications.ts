import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

interface NotificationWithDetails extends Notification {
  workspace?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
  };
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface NotificationFilters {
  type?: string;
  workspace_id?: string;
  read?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
  task_assignments: boolean;
  task_due_dates: boolean;
  project_updates: boolean;
  mentions: boolean;
  comments: boolean;
  workspace_invites: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export function useNotifications(filters?: NotificationFilters) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select(`
          *,
          workspace:workspaces (
            id,
            name
          ),
          project:projects (
            id,
            name
          ),
          task:tasks (
            id,
            title
          ),
          sender:profiles!notifications_sender_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id);
      }
      if (filters?.read !== undefined) {
        if (filters.read) {
          query = query.not('read_at', 'is', null);
        } else {
          query = query.is('read_at', null);
        }
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (query as any);
      if (error) throw error;

      const notificationData = data || [];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n: NotificationWithDetails) => !n.read_at).length);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();

    // Subscribe to real-time notifications
    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as NotificationWithDetails;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show desktop notification if enabled
            showDesktopNotification(newNotification);
            
            // Show toast notification
            toast(newNotification.title, {
              icon: getNotificationIcon(newNotification.type),
              duration: 4000,
            });
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchNotifications, user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.notification_settings) {
        setPreferences(data.notification_settings);
      } else {
        // Set default preferences
        const defaultPrefs: NotificationPreferences = {
          email_notifications: true,
          push_notifications: true,
          desktop_notifications: true,
          task_assignments: true,
          task_due_dates: true,
          project_updates: true,
          mentions: true,
          comments: true,
          workspace_invites: true,
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updatedPrefs = { ...preferences, ...newPreferences };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: updatedPrefs,
        });

      if (error) throw error;

      setPreferences(updatedPrefs);
      toast.success('Notification preferences updated!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({
        ...n,
        read_at: n.read_at || new Date().toISOString()
      })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all as read';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const wasUnread = notifications.find(n => n.id === id && !n.read_at);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAllRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .not('read_at', 'is', null);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !n.read_at));
      toast.success('All read notifications deleted');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete read notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createNotification = async (notificationData: {
    user_id: string;
    workspace_id?: string;
    project_id?: string;
    task_id?: string;
    sender_id?: string;
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: Record<string, unknown>;
  }) => {
    try {
      // Check user preferences before creating notification
      if (!shouldSendNotification(notificationData.type, preferences)) {
        return;
      }

      const insertData: NotificationInsert = {
        user_id: notificationData.user_id,
        workspace_id: notificationData.workspace_id || currentWorkspace?.id || null,
        project_id: notificationData.project_id || null,
        task_id: notificationData.task_id || null,
        sender_id: notificationData.sender_id || user?.id || null,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority || 'normal',
        data: notificationData.data || {},
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .insert(insertData);

      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const sendBulkNotifications = async (notificationsData: Array<{
    user_id: string;
    workspace_id?: string;
    project_id?: string;
    task_id?: string;
    sender_id?: string;
    type: string;
    title: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    data?: Record<string, unknown>;
  }>) => {
    try {
      const notifications = notificationsData.map(data => ({
        user_id: data.user_id,
        workspace_id: data.workspace_id || currentWorkspace?.id || null,
        project_id: data.project_id || null,
        task_id: data.task_id || null,
        sender_id: data.sender_id || user?.id || null,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        data: data.data || {},
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send bulk notifications';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const showDesktopNotification = (notification: NotificationWithDetails) => {
    if (!preferences?.desktop_notifications) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        }
      });
    }
  };

  const shouldSendNotification = (type: string, prefs: NotificationPreferences | null): boolean => {
    if (!prefs) return true;

    switch (type) {
      case 'task_assigned':
        return prefs.task_assignments;
      case 'task_due_soon':
      case 'task_overdue':
        return prefs.task_due_dates;
      case 'project_updated':
        return prefs.project_updates;
      case 'mention':
        return prefs.mentions;
      case 'comment':
        return prefs.comments;
      case 'workspace_invite':
        return prefs.workspace_invites;
      default:
        return true;
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_due_soon':
        return '⏰';
      case 'task_overdue':
        return '🚨';
      case 'project_updated':
        return '📊';
      case 'mention':
        return '👤';
      case 'comment':
        return '💬';
      case 'workspace_invite':
        return '👥';
      case 'milestone_reached':
        return '🎯';
      default:
        return '🔔';
    }
  };

  const getNotificationsByType = (type: string) => {
    return notifications.filter(notification => notification.type === type);
  };

  const getNotificationsByPriority = (priority: 'low' | 'normal' | 'high' | 'urgent') => {
    return notifications.filter(notification => notification.priority === priority);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.read_at);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    preferences,
    fetchNotifications,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    createNotification,
    sendBulkNotifications,
    getNotificationsByType,
    getNotificationsByPriority,
    getUnreadNotifications,
    requestNotificationPermission,
  };
}