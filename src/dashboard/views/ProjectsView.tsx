import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Calendar } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Project {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    status: string;
    progress: number;
    created_at: string;
}

export default function ProjectsView() {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProjects();
    }, [currentWorkspace]);

    const fetchProjects = async () => {
        if (!currentWorkspace || !user) return;

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'on_hold': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create new project
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first project.</p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Create your first project
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Project name
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start date
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End date
                                    </th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredProjects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <Link
                                                    to={`/dashboard/projects/${project.id}/gantt`}
                                                    className="font-medium text-gray-900 hover:text-teal-600 transition-colors"
                                                >
                                                    {project.name}
                                                </Link>
                                                {project.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                                {project.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-600 min-w-[3rem]">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {format(new Date(project.start_date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : 'Not set'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}