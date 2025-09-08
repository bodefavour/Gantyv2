import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, X, MessageSquare, ChevronDown, Search, MoreHorizontal, User } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';

export default function CommunicationView() {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [selectedProject] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('all-tasks');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Array<{ id: string; name: string; assigned_to: string | null; projects: { name: string } }>>([]);
    const [comments, setComments] = useState<Array<{ id: string; content: string; created_at: string; author_id: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [commentInput, setCommentInput] = useState('');

    const tabs = [
        { id: 'all-tasks', name: 'All tasks', active: true },
        { id: 'with-comments', name: 'With new comments', active: false },
        { id: 'mentioned', name: "I'm mentioned", active: false },
        { id: 'assigned', name: "I'm assigned", active: false },
        { id: 'creator', name: "I'm creator of task", active: false },
    ];

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace) { setTasks([]); setComments([]); setLoading(false); return; }
            setLoading(true);
            const client = supabaseAdmin || supabase;
            try {
                // Fetch tasks in workspace with project name
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: t, error: te } = await (client as any)
                    .from('tasks')
                    .select(`id,name,assigned_to, projects!inner(name, workspace_id)`) 
                    .eq('projects.workspace_id', currentWorkspace.id)
                    .order('created_at', { ascending: false });
                if (te) throw te;
                setTasks(t || []);
                if ((t || []).length > 0 && !selectedTaskId) setSelectedTaskId(t[0].id);
            } catch (e) {
                console.error(e);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWorkspace]);

    useEffect(() => {
        const loadComments = async () => {
            if (!selectedTaskId) { setComments([]); return; }
            const client = supabaseAdmin || supabase;
            try {
                // Try new task_comments table first
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: c, error: ce } = await (client as any)
                    .from('task_comments')
                    .select('id, content, created_at, author_id')
                    .eq('task_id', selectedTaskId)
                    .order('created_at', { ascending: true });
                if (!ce) { setComments(c || []); return; }
                // Fallback to generic comments table if exists
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: c2, error: ce2 } = await (client as any)
                    .from('comments')
                    .select('id, content, created_at, author_id')
                    .eq('task_id', selectedTaskId)
                    .order('created_at', { ascending: true });
                if (ce2) throw ce2;
                setComments(c2 || []);
            } catch (e) {
                console.error(e);
                setComments([]);
            }
        };
        loadComments();
    }, [selectedTaskId]);

    const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId) || null, [tasks, selectedTaskId]);

    const addComment = async () => {
        if (!commentInput.trim() || !selectedTaskId || !user) return;
        const client = supabaseAdmin || supabase;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let res: any = await (client as any)
                .from('task_comments')
                .insert({ task_id: selectedTaskId, content: commentInput.trim(), author_id: user.id })
                .select()
                .single();
            if (res.error) {
                // fallback to comments
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                res = await (client as any)
                    .from('comments')
                    .insert({ task_id: selectedTaskId, content: commentInput.trim(), author_id: user.id })
                    .select()
                    .single();
                if (res.error) throw res.error;
            }
            setComments(prev => [...prev, res.data]);
            setCommentInput('');
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Failed to add comment');
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-gray-600" />
                            <h1 className="text-lg font-medium text-gray-900">Communication hub</h1>
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <span>{selectedProject === 'all' ? 'All projects' : selectedProject}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by task name or comment"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
                <div className="flex items-center gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Task List */}
                <div className="w-80 border-r border-gray-200 bg-gray-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">Task</h3>
                            <h3 className="font-medium text-gray-900">{selectedTask?.name || '—'}</h3>
                        </div>

                        {loading ? (
                            <div className="text-sm text-gray-500">Loading…</div>
                        ) : tasks.length === 0 ? (
                            <div className="text-sm text-gray-500">No tasks</div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`p-3 rounded cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                                        onClick={() => setSelectedTaskId(task.id)}
                                    >
                                        <div className={`font-medium mb-1 ${selectedTaskId === task.id ? 'text-white' : 'text-gray-900'}`}>
                                            {task.name}
                                        </div>
                                        <div className={`text-sm flex items-center gap-1 ${selectedTaskId === task.id ? 'text-blue-100' : 'text-gray-600'}`}>
                                            <User className="w-3 h-3" />
                                            <span>{task.projects?.name || '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Task Details */}
                    <div className="px-4 pb-4 text-sm text-gray-600">{tasks.length} total</div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                        {selectedTask ? (
                            <div className="max-w-2xl mx-auto">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedTask.name}</h3>
                                {comments.length === 0 ? (
                                    <div className="text-gray-500 text-sm">No comments yet</div>
                                ) : (
                                    <div className="space-y-3">
                                        {comments.map(c => (
                                            <div key={c.id} className="p-3 border border-gray-200 rounded">
                                                <div className="text-sm text-gray-700">{c.content}</div>
                                                <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">Select a task</div>
                        )}
                    </div>

                    {/* Task Settings */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="max-w-2xl mx-auto flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <input
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                disabled={!selectedTaskId}
                                type="text"
                                placeholder={selectedTaskId ? 'Leave a comment' : 'Select a task to comment'}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                            />
                            <button onClick={addComment} disabled={!selectedTaskId || !commentInput.trim()} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            Attachments
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            Task time tracker
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-500">Apps</span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-blue-500 rounded"></div>
                            </div>
                            Learning center
                        </button>
                        <span className="text-sm text-gray-500">Support</span>
                    </div>
                </div>
            </div>
        </div>
    );
}