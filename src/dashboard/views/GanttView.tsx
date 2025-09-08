import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Filter, Download, Settings, Calendar, Users, BarChart3, List, Table, Eye, Expand as ExpandAll, ListCollapse as CollapseAll } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
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

const viewTabs = [
    { id: 'gantt', name: 'Gantt chart', icon: BarChart3 },
    { id: 'board', name: 'Board', icon: Table },
    { id: 'list', name: 'List', icon: List },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'workload', name: 'Workload', icon: Users },
];

export default function GanttView() {
    const { projectId } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('gantt');

    const fetchProjectData = useCallback(async () => {
        if (!projectId) return;

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
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
        }
    }, [projectId, fetchProjectData]);

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
                        <button 
                            onClick={() => window.history.back()}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Go back"
                        >
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
                        <button 
                            onClick={() => toast('Project settings: Configure permissions, deadlines, and integrations')}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Project settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => toast('View options: Change display mode, zoom level, and filters')}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View options"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => toast('Advanced settings: Custom fields, workflows, and automation')}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Advanced settings"
                        >
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
                            <button 
                                onClick={() => toast('Expand all tasks and subtasks')}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ExpandAll className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">Expand all</span>
                            <button 
                                onClick={() => toast('Collapse all tasks to show only top level')}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <CollapseAll className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">Collapse all</span>
                        </div>

                        <div className="h-4 w-px bg-gray-300"></div>

                        <button 
                            onClick={() => toast('Cascade sorting: Sort tasks by dependencies and priorities')}
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cascade sorting
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => toast('Custom fields: Add project-specific data fields to tasks')}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Custom fields
                        </button>
                        <button 
                            onClick={() => toast('Filter tasks by status, assignee, priority, or custom criteria')}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button 
                            onClick={() => {
                                const csvData = tasks.map(t => `"${t.name}","${t.start_date}","${t.end_date}","${t.status}"`).join('\n');
                                const blob = new Blob(['Task,Start,End,Status\n' + csvData], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'gantt-tasks.csv';
                                a.click();
                                URL.revokeObjectURL(url);
                                toast.success('Tasks exported to CSV');
                            }}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
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
                ) : activeView === 'list' ? (
                    <div className="p-6">
                        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
                            <span>Name</span><span>Start</span><span>End</span><span>Status</span>
                        </div>
                        {tasks.map(t => (
                            <div key={t.id} className="grid grid-cols-4 gap-4 text-sm border-b py-2">
                                <span className="text-gray-900">{t.name}</span>
                                <span className="text-gray-600">{t.start_date}</span>
                                <span className="text-gray-600">{t.end_date}</span>
                                <span className="text-gray-600 capitalize">{t.status?.replace('_',' ')}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-sm text-gray-600">View "{activeView}" is enabled but not configured yet.</div>
                )}
            </div>
        </div>
    );
}