import { useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';

export default function PortfoliosView() {
    const { currentWorkspace } = useWorkspace();
    const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string; start_date: string | null; end_date: string | null }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace) { setProjects([]); setLoading(false); return; }
            setLoading(true);
            try {
                const client = supabaseAdmin || supabase;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (client as any)
                    .from('projects')
                    .select('id,name,status,start_date,end_date')
                    .eq('workspace_id', currentWorkspace.id)
                    .order('name', { ascending: true });
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
    }, [currentWorkspace]);

    const grouped = useMemo(() => {
        const g: Record<string, typeof projects> = {};
        for (const p of projects) {
            const key = p.status || 'unknown';
            if (!g[key]) g[key] = [];
            g[key].push(p);
        }
        return g;
    }, [projects]);

    return (
        <div className="p-6">
            <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Get a high-level picture of your projects with portfolios
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Manage plans, resources, and budgets and analyze risks across multiple projects.
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Create
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Team building</h3>
                </div>

                <div className="flex border-b border-gray-200 mb-6">
                    {['Projects', 'Gantt Chart', 'List', 'Workload', 'Dashboard'].map((tab, index) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${index === 0
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        <span>Project name</span>
                        <div className="flex items-center gap-16">
                            <span>Status</span>
                            <span>Start date</span>
                            <span>End date</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading…</div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No projects found</div>
                    ) : (
                        Object.entries(grouped).map(([status, list]) => (
                            <div key={status}>
                                <div className="text-xs uppercase text-gray-500 font-semibold mt-6 mb-2">{status.replace('_', ' ')}</div>
                                <div className="divide-y divide-gray-100">
                                    {list.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between py-2">
                                            <span className="text-gray-900">{p.name}</span>
                                            <div className="flex items-center gap-16 text-sm text-gray-600">
                                                <span className="capitalize">{p.status?.replace('_', ' ') || '—'}</span>
                                                <span>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</span>
                                                <span>{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}