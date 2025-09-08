import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    X,
    Users,
    ChevronDown,
    Filter,
    Download,
    MoreHorizontal
} from 'lucide-react';
import { addDays, eachDayOfInterval, endOfMonth, format, isWithinInterval, startOfMonth } from 'date-fns';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';

type Member = {
    id: string; // workspace_members.id
    user_id: string;
    role: string;
    profiles: { first_name: string | null; last_name: string | null; email: string } | null;
};

type Task = {
    id: string;
    project_id: string;
    name: string;
    start_date: string;
    end_date: string;
    assigned_to: string | null;
};

export default function WorkloadView() {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [mode] = useState<'Hours' | 'Tasks'>('Hours');
    const [range, setRange] = useState<'1 month' | '3 months' | '6 months'>('1 month');
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace || !user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const client = supabaseAdmin || supabase;
                // fetch members for workspace
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: memberData, error: memberErr } = await (client as any)
                    .from('workspace_members')
                    .select('id, user_id, role, profiles:profiles(first_name,last_name,email)')
                    .eq('workspace_id', currentWorkspace.id);
                if (memberErr) throw memberErr;
                setMembers(memberData || []);

                // fetch projects for workspace
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: projects, error: projErr } = await (client as any)
                    .from('projects')
                    .select('id')
                    .eq('workspace_id', currentWorkspace.id);
                if (projErr) throw projErr;
                const projectIds = (projects || []).map((p: { id: string }) => p.id);

                if (projectIds.length) {
                    // fetch tasks across projects
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: tasksData, error: tErr } = await (client as any)
                        .from('tasks')
                        .select('id, project_id, name, start_date, end_date, assigned_to')
                        .in('project_id', projectIds);
                    if (tErr) throw tErr;
                    setTasks(tasksData || []);
                } else {
                    setTasks([]);
                }
            } catch (e: any) {
                console.error(e);
                toast.error(e.message || 'Failed to load workload');
                setMembers([]);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentWorkspace, user]);

    const monthRange = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const months = range === '1 month' ? 1 : range === '3 months' ? 3 : 6;
        const end = endOfMonth(addDays(start, 30 * months - 1));
        return eachDayOfInterval({ start, end });
    }, [currentMonth, range]);

    // Compute per-day allocation: if a member has a task covering a day, count 1 task or 8h
    const hoursByMemberByDay = useMemo(() => {
        const map = new Map<string, number[]>();
        const days = monthRange.length;
        members.forEach(m => map.set(m.user_id, Array(days).fill(0)));
        tasks.forEach(t => {
            if (!t.assigned_to) return;
            const arr = map.get(t.assigned_to);
            if (!arr) return;
            const taskInterval = { start: new Date(t.start_date), end: new Date(t.end_date) };
            monthRange.forEach((day, i) => {
                if (isWithinInterval(day, taskInterval)) {
                    arr[i] += mode === 'Hours' ? 8 : 1;
                }
            });
        });
        return map;
    }, [members, tasks, monthRange, mode]);

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
                            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                <Users className="w-3 h-3 text-gray-600" />
                            </div>
                            <h1 className="text-lg font-medium text-gray-900">Workload</h1>
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Mode:</span>
                            <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 transition-colors">
                                <span>{mode}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Range:</span>
                            <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 transition-colors">
                                <span>{range}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            Missing a feature?
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Days</span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full">
                                <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Header */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                    {/* Resource column header */}
                    <div className="w-48 px-4 py-3 border-r border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Resource</span>
                    </div>

                    {/* Calendar days header */}
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex items-center justify-center py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                            <span>{format(startOfMonth(currentMonth), 'MMMM yyyy')}</span>
                        </div>

                        {/* Day numbers */}
                        <div className="flex">
                            {monthRange.map((d, i) => (
                                <div key={i} className={`w-8 h-8 flex items-center justify-center text-xs border-r border-gray-200 ${[0,6].includes(d.getDay()) ? 'bg-gray-50 text-gray-400' : 'text-gray-700'}`}>
                                    {format(d, 'dd')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List */}
            <div className="flex-1 overflow-auto">
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-6 text-gray-500">Loading...</div>
                    ) : members.length === 0 ? (
                        <div className="p-6 text-gray-500">No members found</div>
                    ) : members.map((member) => (
                        <div key={member.id} className="flex hover:bg-gray-50 transition-colors">
                            {/* Resource column */}
                            <div className="w-48 px-4 py-3 border-r border-gray-200">
                                <div className="flex items-center gap-3">
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full bg-green-500 flex items-center justify-center`}>
                                            <Users className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {member.profiles?.first_name || ''} {member.profiles?.last_name || member.profiles?.email}
                                        </span>
                                    </div>

                                    <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Hours grid */}
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex">
                                    {monthRange.map((_, i) => {
                                        const hoursArr = hoursByMemberByDay.get(member.user_id);
                                        const val = hoursArr ? hoursArr[i] : 0;
                                        return (
                                            <div key={i} className="w-8 h-12 flex items-center justify-center text-xs text-gray-600 border-r border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                                {val || ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
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