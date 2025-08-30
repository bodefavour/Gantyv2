import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Comment = Database['public']['Tables']['comments']['Row'] & {
    author?: {
        first_name: string | null;
        last_name: string | null;
        email: string;
        avatar_url: string | null;
    };
    replies?: Comment[];
};

export function useComments(projectId?: string, taskId?: string) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = async () => {
        if (!projectId && !taskId) {
            setComments([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let query = supabase
                .from('comments')
                .select(`
          *,
          author:profiles!comments_author_id_fkey (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
                .is('parent_id', null)
                .order('created_at', { ascending: false });

            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            if (taskId) {
                query = query.eq('task_id', taskId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setComments(data || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [projectId, taskId]);

    const createComment = async (commentData: {
        content: string;
        project_id?: string;
        task_id?: string;
        parent_id?: string;
        mentions?: string[];
    }) => {
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await (supabase as any)
            .from('comments')
            .insert({
                ...commentData,
                author_id: user.id,
            })
            .select(`
        *,
        author:profiles!comments_author_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
            .single();

        if (error) throw error;

        if (!commentData.parent_id) {
            setComments(prev => [data, ...prev]);
        }

        toast.success('Comment added successfully!');
        return data;
    };

    const updateComment = async (id: string, content: string) => {
        const { data, error } = await (supabase as any)
            .from('comments')
            .update({ content })
            .eq('id', id)
            .select(`
        *,
        author:profiles!comments_author_id_fkey (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
            .single();

        if (error) throw error;

        setComments(prev => prev.map(c =>
            c.id === id ? { ...c, ...data } as Comment : c
        ));

        toast.success('Comment updated successfully!');
        return data;
    };

    const deleteComment = async (id: string) => {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        setComments(prev => prev.filter(c => c.id !== id));
        toast.success('Comment deleted successfully!');
    };

    return {
        comments,
        loading,
        error,
        fetchComments,
        createComment,
        updateComment,
        deleteComment,
    };
}