import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (error) throw error;
      setTasks(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const createTask = async (taskData: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    parent_id?: string;
    assigned_to?: string;
    priority?: string;
  }) => {
    if (!projectId) throw new Error('No project selected');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        project_id: projectId,
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
      })
      .select()
      .single();

    if (error) throw error;
    
    setTasks(prev => [...prev, data]);
    return data;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    return data;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}