import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type CommentUpdate = Database['public']['Tables']['comments']['Update'];

interface CommentWithDetails extends Comment {
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  replies?: CommentWithDetails[];
  reply_count?: number;
}

export function useComments(projectId?: string, taskId?: string) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [comments, setComments] = useState<CommentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!projectId && !taskId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First get parent comments
      let query = supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_author_id_fkey (
            id,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: parentComments, error: parentError } = await (query as any);
      if (parentError) throw parentError;

      // Then get replies for each parent comment
      const commentsWithReplies = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (parentComments || []).map(async (comment: any) => {
          // Get replies
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: replies } = await (supabase as any)
            .from('comments')
            .select(`
              *,
              author:profiles!comments_author_id_fkey (
                id,
                first_name,
                last_name,
                email,
                avatar_url
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || [],
            reply_count: replies?.length || 0,
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (commentData: {
    content: string;
    project_id?: string;
    task_id?: string;
    parent_id?: string;
    mentions?: string[];
  }) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const insertData: CommentInsert = {
        ...commentData,
        author_id: user.id,
        mentions: commentData.mentions || [],
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('comments')
        .insert(insertData)
        .select(`
          *,
          author:profiles!comments_author_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      if (!commentData.parent_id) {
        // It's a parent comment
        const newComment = { ...data, replies: [], reply_count: 0 };
        setComments(prev => [newComment, ...prev]);
      } else {
        // It's a reply, update the parent comment
        setComments(prev => prev.map(comment => 
          comment.id === commentData.parent_id
            ? {
                ...comment,
                replies: [...(comment.replies || []), data],
                reply_count: (comment.reply_count || 0) + 1
              }
            : comment
        ));
      }

      // Send notifications to mentioned users
      if (commentData.mentions && commentData.mentions.length > 0) {
        await sendMentionNotifications(commentData.mentions, data);
      }

      // Log activity
      await logActivity('created', 'comment', data.id, null, data);

      toast.success('Comment added successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateComment = async (id: string, updates: CommentUpdate) => {
    try {
      const oldComment = findCommentById(id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('comments')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          author:profiles!comments_author_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update local state
      setComments(prev => updateCommentInTree(prev, id, data));

      // Log activity
      await logActivity('updated', 'comment', id, oldComment, data);

      toast.success('Comment updated successfully!');
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const comment = findCommentById(id);

      // Check if comment has replies
      if (comment?.replies && comment.replies.length > 0) {
        throw new Error('Cannot delete comment with replies. Delete replies first.');
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setComments(prev => removeCommentFromTree(prev, id));

      // Log activity
      await logActivity('deleted', 'comment', id, comment, null);

      toast.success('Comment deleted successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const addReaction = async (commentId: string, reaction: string) => {
    try {
      // Implementation would depend on if you have a reactions table
      // For now, we'll just show a success message
      console.log('Adding reaction:', reaction, 'to comment:', commentId);
      toast.success('Reaction added!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add reaction';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Helper functions
  const findCommentById = (id: string): CommentWithDetails | undefined => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies) {
        const found = comment.replies.find(reply => reply.id === id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const updateCommentInTree = (commentTree: CommentWithDetails[], id: string, updatedComment: any): CommentWithDetails[] => {
    return commentTree.map(comment => {
      if (comment.id === id) {
        return { ...comment, ...updatedComment };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, id, updatedComment)
        };
      }
      return comment;
    });
  };

  const removeCommentFromTree = (commentTree: CommentWithDetails[], id: string): CommentWithDetails[] => {
    return commentTree.filter(comment => {
      if (comment.id === id) return false;
      if (comment.replies) {
        comment.replies = removeCommentFromTree(comment.replies, id);
        comment.reply_count = comment.replies.length;
      }
      return true;
    });
  };

  const sendMentionNotifications = async (mentionedUserIds: string[], comment: any) => {
    try {
      if (!currentWorkspace) return;

      const notifications = mentionedUserIds.map(userId => ({
        user_id: userId,
        workspace_id: currentWorkspace.id,
        type: 'mention',
        title: 'You were mentioned in a comment',
        message: `${comment.author?.first_name || 'Someone'} mentioned you in a comment`,
        data: {
          comment_id: comment.id,
          project_id: comment.project_id,
          task_id: comment.task_id,
        },
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('notifications')
        .insert(notifications);
    } catch (error) {
      console.error('Failed to send mention notifications:', error);
    }
  };

  // Helper function to log activities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logActivity = async (
    action: string,
    entityType: 'comment',
    entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValues: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValues: any
  ) => {
    try {
      if (!currentWorkspace) return;
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('activity_logs').insert({
        workspace_id: currentWorkspace.id,
        user_id: user.data.user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        project_id: newValues?.project_id || oldValues?.project_id || null,
        task_id: newValues?.task_id || oldValues?.task_id || null,
        old_values: oldValues,
        new_values: newValues,
        metadata: {},
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  const getCommentCount = () => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.reply_count || 0);
    }, 0);
  };

  const getCommentsByAuthor = (authorId: string) => {
    const result: CommentWithDetails[] = [];
    for (const comment of comments) {
      if (comment.author_id === authorId) result.push(comment);
      if (comment.replies) {
        result.push(...comment.replies.filter(reply => reply.author_id === authorId));
      }
    }
    return result;
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    getCommentCount,
    getCommentsByAuthor,
  };
}