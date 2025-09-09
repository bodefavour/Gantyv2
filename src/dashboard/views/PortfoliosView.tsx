import { useEffect, useState } from 'react';
import { Briefcase, Plus, MoreHorizontal } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import toast from 'react-hot-toast';
import CreateItemModal from '../../components/modals/CreateItemModal';

interface Portfolio { id: string; name: string; description: string | null; created_at: string; }
interface Project { id: string; name: string; status: string; start_date: string; end_date: string | null; progress: number; }

export default function PortfoliosView() {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [portfolioProjects, setPortfolioProjects] = useState<Record<string, string[]>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!currentWorkspace || !user) { setLoading(false); return; }
            setLoading(true);
            try {
                const client = supabaseAdmin || supabase;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: pf, error: pe } = await (client as any).from('portfolios').select('*').eq('workspace_id', currentWorkspace.id).order('created_at',{ascending:false});
                if (pe) throw pe;
                setPortfolios(pf || []);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: pr, error: pre } = await (client as any).from('projects').select('*').eq('workspace_id', currentWorkspace.id);
                if (pre) throw pre;
                setProjects(pr || []);
                if ((pf||[]).length) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: mapRows, error: mapErr } = await (client as any).from('portfolio_projects').select('portfolio_id,project_id').in('portfolio_id', (pf||[]).map((p: any)=>p.id));
                    if (mapErr) throw mapErr;
                    const map: Record<string,string[]> = {};
                    (mapRows||[]).forEach((r:any)=>{ map[r.portfolio_id] = map[r.portfolio_id] || []; map[r.portfolio_id].push(r.project_id); });
                    setPortfolioProjects(map);
                } else setPortfolioProjects({});
            } catch(e:any) {
                console.error(e); toast.error(e.message||'Failed loading portfolios');
            } finally { setLoading(false); }
        };
        load();
    }, [currentWorkspace, user]);

    const createPortfolio = async (name: string) => {
        if (!currentWorkspace || !user) return toast.error('Workspace required');
        if (!name.trim()) return;
        try {
            const client = supabaseAdmin || supabase;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (client as any).from('portfolios').insert({ workspace_id: currentWorkspace.id, name: name.trim(), description: null, owner_id: user.id }).select().single();
            if (error) throw error;
            setPortfolios(prev=>[data,...prev]);
            // auto-link all existing projects
            if (projects.length) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: linkErr } = await (client as any).from('portfolio_projects').insert(projects.map(p=>({ portfolio_id: data.id, project_id: p.id })));
                if (linkErr) console.warn('Link warning', linkErr.message);
                setPortfolioProjects(prev=>({...prev, [data.id]: projects.map(p=>p.id)}));
            }
            toast.success('Portfolio created');
        } catch(e:any){ console.error(e); toast.error(e.message||'Create failed'); }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-600" />
                    <h1 className="text-lg font-medium text-gray-900">Portfolios</h1>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> New portfolio
                </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
                {loading ? (
                    <div className="text-gray-500">Loading...</div>
                ) : portfolios.length === 0 ? (
                    <div className="text-center py-20">
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No portfolios yet</p>
                        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm">Create your first portfolio</button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {portfolios.map(p => {
                            const projIds = portfolioProjects[p.id] || [];
                            const projs = projects.filter(pr => projIds.includes(pr.id));
                            return (
                                <div key={p.id} className="border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center gap-2 font-medium text-gray-900">
                                            <Briefcase className="w-4 h-4 text-gray-500" /> {p.name}
                                            <span className="text-xs text-gray-500">({projs.length} projects)</span>
                                        </div>
                                        <button onClick={() => toast('Portfolio options coming soon')} className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                                    </div>
                                    <div>
                                        <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-gray-600 border-b border-gray-100">
                                            <span>Name</span><span>Status</span><span>Progress</span><span>Start</span><span>End</span>
                                        </div>
                                        {projs.length === 0 ? (
                                            <div className="px-4 py-4 text-sm text-gray-500">No linked projects</div>
                                        ) : projs.map(pr => (
                                            <div key={pr.id} className="grid grid-cols-5 gap-4 px-4 py-2 text-sm hover:bg-gray-50">
                                                <span className="font-medium text-gray-900 truncate">{pr.name}</span>
                                                <span className="capitalize text-gray-700">{pr.status.replace('_',' ')}</span>
                                                <span className="text-gray-700">{pr.progress}%</span>
                                                <span className="text-gray-500">{new Date(pr.start_date).toLocaleDateString()}</span>
                                                <span className="text-gray-500">{pr.end_date ? new Date(pr.end_date).toLocaleDateString() : '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Portfolio Modal */}
            <CreateItemModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={createPortfolio}
                title="Create Portfolio"
                placeholder="Portfolio name..."
            />
        </div>
    );
}