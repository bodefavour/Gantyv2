import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Filter, Download, Settings, Calendar, Users, BarChart3, List, Table, Eye, Expand as ExpandAll, ListCollapse as CollapseAll } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import GanttChart from '../gantt/GanttChart';
import TaskList from '../gantt/TaskList';

interface Task {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    progress: number;
    status: string;
    assigned_to: string | null;
    parent_id: string | null;
}

const viewTabs = [
    { id: 'gantt', name: 'Gantt chart', icon: BarChart3 },
    { id: 'board', name: 'Board', icon: Table },
    { id: 'list', name: 'List', icon: List },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'workload', name: 'Workload', icon: Users },
];

export default function GanttView() {
    const { projectId } = useParams();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('gantt');
    const [expandedTasks, setExpandedTasks] = useState(new Set());

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            // Fetch project details
            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (projectError) throw projectError;
            setProject(projectData);

            // Fetch tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at');

            if (tasksError) throw tasksError;
            setTasks(tasksData || []);
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="h-full flex flex-col">
            {/* Project Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{project?.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Project Admin</span>
                                <span>•</span>
                                <span>{format(new Date(), 'MMMM yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {viewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeView === tab.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <ExpandAll className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">Expand all</span>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <CollapseAll className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">Collapse all</span>
                        </div>

                        <div className="h-4 w-px bg-gray-300"></div>

                        <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Cascade sorting
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Filter className="w-4 h-4" />
                            Custom fields
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <span className="text-sm text-gray-500">View</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {activeView === 'gantt' ? (
                    <div className="h-full flex">
                        <TaskList tasks={tasks} />
                        <GanttChart tasks={tasks} />
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {viewTabs.find(tab => tab.id === activeView)?.name} View
                            </h3>
                            <p className="text-gray-600">This view is coming soon.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}