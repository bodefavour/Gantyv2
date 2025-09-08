import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    X,
    Clock,
    ChevronDown,
    RefreshCw,
    Download,
    MoreHorizontal,
    ArrowUpDown
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';

type LogRow = { id: string; task_id: string | null; project_id: string | null; description: string | null; minutes: number; date: string };

export default function TimeLogView() {
    const [groupBy] = useState('date');
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [rows, setRows] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace || !user) { setRows([]); setLoading(false); return; }
            setLoading(true);
            try {
                const client = supabaseAdmin || supabase;
                // Try timelogs table first
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let { data, error } = await (client as any)
                    .from('timelogs')
                    .select('id, task_id, project_id, description, minutes, date')
                    .eq('workspace_id', currentWorkspace.id)
                    .order('date', { ascending: false })
                    .limit(200);
                if (error && (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('table'))) {
                    // Fallback: derive from tasks (placeholder)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: tasks, error: terr } = await (client as any)
                        .from('tasks')
                        .select('id, project_id, name, estimated_hours, created_at')
                        .eq('workspace_id', currentWorkspace.id)
                        .order('created_at', { ascending: false })
                        .limit(50);
                    if (terr) throw terr;
                    const derived: LogRow[] = (tasks || []).map((t: any) => ({
                        id: t.id,
                        task_id: t.id,
                        project_id: t.project_id,
                        description: t.name,
                        minutes: Math.round((t.estimated_hours || 0) * 60),
                        date: t.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                    }));
                    setRows(derived);
                } else {
                    if (error) throw error;
                    setRows((data || []) as LogRow[]);
                }
            } catch (e) {
                console.error(e);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentWorkspace, user]);

    const totalMinutes = useMemo(() => rows.reduce((acc, r) => acc + (r.minutes || 0), 0), [rows]);
    const totalHours = useMemo(() => (totalMinutes / 60).toFixed(1), [totalMinutes]);

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
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                            <h1 className="text-lg font-medium text-gray-900">My time log</h1>
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Total time spent: {loading ? '…' : `${totalHours}h`}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Group by</span>
                            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <span>{groupBy}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-5 gap-4 px-6 py-3 text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                        <span>Task name</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Project</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Date</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Time</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Comment</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="text-center py-16 text-gray-500">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No time entries found</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {rows.map(r => (
                            <div key={r.id} className="grid grid-cols-5 gap-4 px-6 py-3 text-sm">
                                <div className="text-gray-900">{r.description || '—'}</div>
                                <div className="text-gray-600">{r.project_id || '—'}</div>
                                <div className="text-gray-600">{r.date}</div>
                                <div className="text-gray-900">{(r.minutes / 60).toFixed(2)}h</div>
                                <div className="text-gray-500">—</div>
                            </div>
                        ))}
                    </div>
                )}
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