import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const notificationData = data || [];
            setNotifications(notificationData);
            setUnreadCount(notificationData.filter((n: any) => !n.read_at).length);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

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
                        setNotifications(prev => [payload.new as Notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        const { error } = await (supabase as any)
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        if (!user) return;

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
    };

    const createNotification = async (notificationData: {
        user_id: string;
        workspace_id?: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }) => {
        const { error } = await (supabase as any)
            .from('notifications')
            .insert(notificationData);

        if (error) throw error;
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        createNotification,
    };
}