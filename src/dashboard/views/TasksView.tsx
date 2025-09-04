import React, { useState, useEffect } from 'react';
import {
    ArrowUpDown,
    Filter,
    Download,
    Plus,
    MoreHorizontal,
    RefreshCw,
    Settings,
    Eye,
    X,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { supabase } from '../../../lib/supabase';

interface Task {
    id: string;
    project_id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: string;
    priority: string;
    assigned_to: string | null;
    created_at: string;
    projects: {
        name: string;
    };
}

export default function TasksView() {
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('incomplete');

    useEffect(() => {
        fetchTasks();
    }, [currentWorkspace, user]);

    const fetchTasks = async () => {
        if (!currentWorkspace || !user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          projects!inner (
            name,
            workspace_id
          )
        `)
                .eq('projects.workspace_id', currentWorkspace.id)
                .eq('assigned_to', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (activeFilter === 'incomplete') {
            return task.status !== 'completed';
        }
        return true;
    });

    if (loading) {
        return (
            <div className="h-full flex">
                <div className="flex-1 p-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            </div>
                            <h1 className="text-lg font-medium text-gray-900">My tasks</h1>
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* View Tab */}
                <div className="mt-4">
                    <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded">
                        List
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Number of tasks: {filteredTasks.length}</span>
                        <button
                            onClick={() => setActiveFilter('incomplete')}
                            className={`text-sm transition-colors ${activeFilter === 'incomplete'
                                    ? 'text-blue-600 font-medium'
                                    : 'text-blue-600 hover:text-blue-700'
                                }`}
                        >
                            My incomplete tasks
                        </button>
                        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            Missing a feature?
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Settings className="w-4 h-4" />
                            Custom fields
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-7 gap-4 px-6 py-3 text-sm font-medium text-gray-700">
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
                        <span>Start date</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Assigned</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Status</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Time log</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg">There are no tasks in the project</p>
                    </div>
                ) : (
                    <div className="w-full">
                        <div className="divide-y divide-gray-100">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className="grid grid-cols-7 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={task.status === 'completed'}
                                            readOnly
                                        />
                                        <span className="font-medium text-gray-900 truncate">{task.name}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="text-gray-600 truncate">{task.projects.name}</span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="text-gray-600 text-sm">
                                            {new Date(task.start_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="text-gray-600 text-sm">
                                            {task.assigned_to ? 'You' : 'Unassigned'}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="text-gray-600 text-sm">
                                            {task.status === 'not_started' ? 'Open' : task.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <div className="flex items-center">
                                        <span className="text-gray-600 text-sm">0h</span>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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