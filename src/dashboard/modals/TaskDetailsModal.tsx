import { useEffect, useMemo, useState } from 'react';
import { X, User, Calendar, Clock, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';

type TaskRow = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  status: string;
  priority: string;
  assigned_to: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  created_at: string;
  created_by?: string | null;
};

interface Props {
  open: boolean;
  task: TaskRow | null;
  onClose: () => void;
}

export default function TaskDetailsModal({ open, task, onClose }: Props) {
  const [creator, setCreator] = useState<{ first_name: string | null; last_name: string | null; email: string } | null>(null);
  const [dependencies, setDependencies] = useState<Array<{ id: string; type: string; lag: number; predecessor: { id: string; name: string } }>>([]);
  const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string; author_id: string }>>([]);
  const [commentText, setCommentText] = useState('');
  const client = supabaseAdmin || supabase;

  useEffect(() => {
    if (!open || !task) return;
    const load = async () => {
      try {
        // Creator
        if (task.created_by) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: prof, error: pe } = await (client as any)
            .from('profiles')
            .select('first_name,last_name,email')
            .eq('id', task.created_by)
            .maybeSingle();
          if (!pe && prof) setCreator(prof);
        }

        // Dependencies (predecessors)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: deps, error: de } = await (client as any)
          .from('task_dependencies')
          .select('id,type,lag, predecessor:predecessor_id ( id, name )')
          .eq('successor_id', task.id);
        if (!de) setDependencies((deps || []).map((d: any) => ({ id: d.id, type: d.type, lag: d.lag ?? 0, predecessor: d.predecessor })));

        // Comments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cs, error: ce } = await (client as any)
          .from('task_comments')
          .select('id, content, created_at, author_id')
          .eq('task_id', task.id)
          .order('created_at', { ascending: true });
        if (!ce) setComments(cs || []);
      } catch (e) {
        // ignore
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const creatorName = useMemo(() => {
    if (!creator) return '—';
    const fn = creator.first_name || '';
    const ln = creator.last_name || '';
    return (fn + ' ' + ln).trim() || creator.email;
  }, [creator]);

  if (!open || !task) return null;

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client as any)
        .from('task_comments')
        .insert({ task_id: task.id, content: commentText.trim() })
        .select()
        .single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setCommentText('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to add comment');
    }
  };

  // Simple mapping of dependency type to short code
  const depShort = (t: string) => {
    switch (t) {
      case 'finish_to_start':
        return 'FS';
      case 'start_to_start':
        return 'SS';
      case 'finish_to_finish':
        return 'FF';
      case 'start_to_finish':
        return 'SF';
      default:
        return 'FS';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl max-h-[85vh] rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="text-xs text-gray-500">Work / Summary task</div>
            <h2 className="text-xl font-semibold text-gray-900">{task.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Meta row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Creator</div>
              <div className="text-gray-900">{creatorName}</div>
              <div className="text-xs text-gray-500">{new Date(task.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Progress</div>
              <div className="text-gray-900">{Math.round(task.progress || 0)}%</div>
              <div className="text-xs text-gray-500 capitalize">{(task.status || 'open').replace('_',' ')}</div>
            </div>
            <div>
              <div className="text-gray-500">Priority</div>
              <div className="text-gray-900 capitalize">{task.priority || 'medium'}</div>
              <div className="text-xs text-gray-500">Logged time: {task.actual_hours ?? 0}</div>
            </div>
            <div>
              <div className="text-gray-500">Estimation</div>
              <div className="text-gray-900">{task.estimated_hours ?? 0}</div>
              <div className="text-xs text-gray-500">Duration: {task.duration}d</div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar className="w-4 h-4" /> Start date</div>
              <div className="text-gray-900">{new Date(task.start_date).toLocaleDateString()} <span className="text-xs text-gray-500">04:00PM</span></div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar className="w-4 h-4" /> End date</div>
              <div className="text-gray-900">{new Date(task.end_date).toLocaleDateString()} <span className="text-xs text-gray-500">04:00PM</span></div>
            </div>
            <div className="p-3 border border-gray-200 rounded">
              <div className="flex items-center gap-2 text-gray-500 mb-1"><Clock className="w-4 h-4" /> Deadline</div>
              <div className="text-gray-900">—</div>
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-gray-600" />
              <div className="text-gray-900 font-medium">Task dependencies {dependencies.length}</div>
            </div>
            {dependencies.length === 0 ? (
              <div className="text-sm text-gray-500">No dependencies</div>
            ) : (
              <div className="space-y-2">
                {dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between p-2 border border-gray-200 rounded text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-600 text-xs">{depShort(dep.type)}</div>
                      <div>
                        <div className="text-gray-900">{dep.predecessor?.name || 'Task'}</div>
                        <div className="text-xs text-gray-500">Lag: {dep.lag ?? 0}</div>
                      </div>
                    </div>
                    <button className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">Change</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <User className="w-4 h-4" />
                Leave a comment
              </div>
              <button className="text-gray-500 text-sm flex items-center gap-1">
                Sort <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 mb-3">
              {comments.length === 0 ? (
                <div className="text-sm text-gray-500">No comments yet</div>
              ) : comments.map(c => (
                <div key={c.id} className="p-3 border border-gray-200 rounded">
                  <div className="text-sm text-gray-800">{c.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Leave a comment"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={addComment} disabled={!commentText.trim()} className="px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
