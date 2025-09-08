import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    X,
    BarChart3,
    MoreHorizontal
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';

const reportTabs = [
    { id: 'all', name: 'All', active: true },
    { id: 'progress', name: 'Progress', active: false },
    { id: 'budget', name: 'Budget', active: false },
    { id: 'time-on-tasks', name: 'Time on tasks', active: false },
];

export default function ReportsView() {
    const [activeTab, setActiveTab] = useState('all');
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Array<{ id: string; status: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace || !user) {
                setProjects([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const client = supabaseAdmin || supabase;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (client as any)
                    .from('projects')
                    .select('id,status')
                    .eq('workspace_id', currentWorkspace.id);
                if (error) throw error;
                setProjects(data || []);
            } catch (e) {
                console.error(e);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentWorkspace, user]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
        projects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
        return counts;
    }, [projects]);

    const total = useMemo(() => projects.length || 1, [projects.length]);
    const circumference = 2 * Math.PI * 40;
    const segments = useMemo(() => {
        // Map statuses to colors
        const parts = [
            { key: 'active', color: '#10B981' },
            { key: 'on_hold', color: '#F59E0B' },
            { key: 'completed', color: '#3B82F6' },
            { key: 'planning', color: '#9CA3AF' },
            { key: 'cancelled', color: '#6B7280' },
        ] as const;
        let offset = 0;
        return parts.map(p => {
            const fraction = (statusCounts[p.key] || 0) / total;
            const dash = fraction * circumference;
            const seg = { color: p.color, dasharray: `${dash} ${circumference}`, dashoffset: -offset };
            offset += dash;
            return seg;
        });
    }, [statusCounts, total]);

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
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                            <h1 className="text-lg font-medium text-gray-900">Reports</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            Missing a feature?
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Report Tabs */}
                <div className="flex items-center gap-1 mt-4">
                    {reportTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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
            <div className="flex-1 p-6">
                {activeTab === 'all' && (
                <>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Project status</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Milestone Timeline */}
                    <div className="bg-white">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Milestone timeline</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Get visual representation of your project's milestones along a timeline.
                        </p>

                        <div className="relative h-64 bg-gray-50 rounded-lg p-6">
                            {/* Timeline */}
                            <div className="relative h-full">
                                {/* Vertical line */}
                                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-300"></div>

                                {/* Today marker */}
                                <div className="absolute left-6 top-4 w-4 h-6 bg-gray-800 text-white text-xs flex items-center justify-center rounded">
                                    Today
                                </div>

                                {/* Milestones */}
                                <div className="absolute left-4 top-16 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                <div className="absolute left-20 top-14 text-sm">
                                    <div className="font-medium text-gray-900">Milestone 2</div>
                                    <div className="text-xs text-gray-500">Feb 17, 2025</div>
                                </div>

                                <div className="absolute left-4 top-32 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <div className="absolute left-20 top-30 text-sm">
                                    <div className="font-medium text-gray-900">Milestone 2</div>
                                    <div className="text-xs text-gray-500">Apr 02, 2025</div>
                                </div>

                                <div className="absolute left-4 top-48 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <div className="absolute left-20 top-46 text-sm">
                                    <div className="font-medium text-gray-900">Milestone 3</div>
                                    <div className="text-xs text-gray-500">Jul 15, 2025</div>
                                </div>

                                {/* Month labels */}
                                <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-medium">Jan</div>
                                <div className="absolute bottom-4 left-24 text-xs text-gray-500 font-medium">Apr</div>
                                <div className="absolute bottom-4 right-8 text-xs text-gray-500 font-medium">Jul</div>
                            </div>
                        </div>
                    </div>

                    {/* Projects by Status */}
                    <div className="bg-white">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Projects by status</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Get a color-coded pie chart overview of your projects based on their current statuses — on track, off track, at risk or under custom statuses.
                        </p>

                        <div className="relative h-64 flex items-center justify-center">
                            {/* Pie Chart */}
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    {segments.map((s, idx) => (
                                        <circle key={idx} cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={s.dasharray} strokeDashoffset={s.dashoffset} />
                                    ))}
                                </svg>

                                {/* Center percentages */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{loading ? '...' : projects.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 space-y-3">
                                {[
                                    { label: 'Active', color: 'bg-emerald-500', key: 'active' },
                                    { label: 'On hold', color: 'bg-amber-500', key: 'on_hold' },
                                    { label: 'Completed', color: 'bg-blue-500', key: 'completed' },
                                    { label: 'Planning', color: 'bg-gray-400', key: 'planning' },
                                    { label: 'Cancelled', color: 'bg-gray-500', key: 'cancelled' },
                                ].map(({ label, color, key }) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                        <div className={`w-3 h-3 ${color} rounded-sm`}></div>
                                        <span className="text-gray-700">{label} ({statusCounts[key] || 0})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                </>
                )}
                {activeTab === 'progress' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(statusCounts).map(([k,v]) => (
                            <div key={k} className="bg-white border border-gray-200 rounded p-4">
                                <div className="text-sm text-gray-500 capitalize">{k.replace('_',' ')}</div>
                                <div className="text-2xl font-semibold text-gray-900">{v}</div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'budget' && (
                    <div className="text-sm text-gray-600">No budget fields yet. Add fields to projects to enable budget reporting.</div>
                )}
                {activeTab === 'time-on-tasks' && (
                    <div className="text-sm text-gray-600">Time tracking not enabled. Hook your time tracker to see charts.</div>
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