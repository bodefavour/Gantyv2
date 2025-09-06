import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Users,
    TrendingUp,
    ChevronDown,
    Star,
    Download,
    Eye,
    Settings,
    Expand,
    Minimize,
    ArrowUpDown,
    Circle,
    CheckCircle,
    BarChart3,
    Table,
    List as ListIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

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

interface Task {
    id: string;
    project_id: string;
    parent_id: string | null;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    duration: number;
    progress: number;
    status: string;
    priority: string;
    assigned_to: string | null;
    created_at: string;
}

const viewTabs = [
    { id: 'gantt', name: 'Gantt chart', icon: BarChart3 },
    { id: 'board', name: 'Board', icon: Table },
    { id: 'list', name: 'List', icon: ListIcon },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'workload', name: 'Workload', icon: Users },
    { id: 'people', name: 'People', icon: Users },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
];

export default function ProjectsView() {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('gantt');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [newTaskName, setNewTaskName] = useState('');
    const [addingTask, setAddingTask] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentWorkspace]);

    const fetchData = async () => {
        if (!currentWorkspace || !user) return;

        try {
            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

            // Fetch all tasks for all projects
            if (projectsData && projectsData.length > 0) {
                const projectIds = projectsData.map(p => p.id);
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('start_date');

                if (tasksError) throw tasksError;
                setTasks(tasksData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load projects and tasks');
        } finally {
            setLoading(false);
        }
    };

    // Generate date range for Gantt chart
    const dateRange = React.useMemo(() => {
        const start = startOfWeek(startOfMonth(addDays(currentDate, -30)));
        const end = endOfWeek(endOfMonth(addDays(currentDate, 60)));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const dayWidth = 32;

    const getTaskPosition = (task: Task) => {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const startIndex = dateRange.findIndex(date =>
            format(date, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
        );
        const duration = differenceInDays(endDate, startDate) + 1;

        return {
            left: Math.max(0, startIndex * dayWidth),
            width: Math.max(dayWidth, duration * dayWidth),
        };
    };

    const getStatusIcon = (status: string, progress: number) => {
        if (status === 'completed' || progress === 100) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        return <Circle className="w-4 h-4 text-gray-400" />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'active': return 'bg-blue-500';
            case 'in_progress': return 'bg-blue-500';
            case 'on_hold': return 'bg-yellow-500';
            case 'planning': return 'bg-purple-500';
            default: return 'bg-gray-400';
        }
    };

    const addTask = async () => {
        if (!newTaskName.trim() || !projects[0]) return;

        setAddingTask(true);
        try {
            const startDate = new Date();
            const endDate = addDays(startDate, 7);

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    project_id: projects[0].id,
                    name: newTaskName,
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    created_by: user?.id || '',
                })
                .select()
                .single();

            if (error) throw error;

            setTasks(prev => [...prev, data]);
            setNewTaskName('');
            toast.success('Task added successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setAddingTask(false);
        }
    };

    const updateTaskDates = async (taskId: string, startDate: Date, endDate: Date) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                })
                .eq('id', taskId);

            if (error) throw error;

            setTasks(prev => prev.map(task =>
                task.id === taskId
                    ? { ...task, start_date: format(startDate, 'yyyy-MM-dd'), end_date: format(endDate, 'yyyy-MM-dd') }
                    : task
            ));
        } catch (error: any) {
            toast.error('Failed to update task dates');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex">
                <div className="w-80 bg-white border-r border-gray-200 p-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-6 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
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
        <div className="h-full flex flex-col">
            {/* Project Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-400" />
                            <h1 className="text-xl font-semibold text-gray-900">{currentWorkspace?.name || 'Azeem'}</h1>
                            <Star className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>No status</span>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Project Admin</span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* View Tabs */}
                <div className="flex items-center gap-1">
                    {viewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab.id === activeView
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
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
                            <input type="checkbox" className="rounded border-gray-300" />
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Expand className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500">Expand all</span>
                            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Minimize className="w-4 h-4" />
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Days</span>
                            <div className="w-16 h-1 bg-gray-200 rounded"></div>
                        </div>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">View</span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Task List Panel */}
                <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
                    {/* Task List Header */}
                    <div className="border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                            <span>Task name</span>
                            <div className="flex items-center gap-8">
                                <span>Assigned</span>
                                <span>Status</span>
                                <div className="w-6"></div>
                            </div>
                        </div>
                    </div>

                    {/* Task List Content */}
                    <div className="flex-1 overflow-auto">
                        {projects.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">No projects found</p>
                                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Create a project
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {/* Group tasks by project */}
                                {projects.map((project, projectIndex) => {
                                    const projectTasks = tasks.filter(task => task.project_id === project.id);

                                    return (
                                        <div key={project.id}>
                                            {/* Project Header */}
                                            <div className="px-4 py-3 bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-gray-500 w-6">{projectIndex + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <Link
                                                                to={`/dashboard/projects/${project.id}/gantt`}
                                                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                                                            >
                                                                {project.name}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="w-20 text-gray-500 truncate">unassigned</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="w-16 text-gray-600">Open</span>
                                                        </div>
                                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Project Tasks */}
                                            {projectTasks.map((task, taskIndex) => (
                                                <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-500 w-6">{projectIndex + 1}.{taskIndex + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(task.status, task.progress)}
                                                                <span className="font-medium text-gray-900 truncate">{task.name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="w-20 text-gray-500 truncate">
                                                                {task.assigned_to ? 'Azeem' : 'unassigned'}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                <span className="w-16 text-gray-600">
                                                                    {task.status === 'not_started' ? 'Open' : task.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Add Task Actions */}
                                <div className="px-4 py-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-blue-600" />
                                        <input
                                            type="text"
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                            placeholder="Add a task"
                                            className="flex-1 text-sm text-blue-600 placeholder-blue-600 bg-transparent border-none outline-none"
                                        />
                                        {newTaskName && (
                                            <button
                                                onClick={addTask}
                                                disabled={addingTask}
                                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                {addingTask ? 'Adding...' : 'Add'}
                                            </button>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm">
                                        <Plus className="w-4 h-4" />
                                        Add a milestone
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gantt Chart Panel */}
                <div className="flex-1 overflow-auto bg-gray-50">
                    {/* Timeline Header */}
                    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                        {/* Month Headers */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentDate(addDays(currentDate, -30))}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span>August 2025</span>
                                <button
                                    onClick={() => setCurrentDate(addDays(currentDate, 30))}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <span>September 2025</span>
                        </div>

                        {/* Day Headers */}
                        <div className="h-12 flex items-center border-b border-gray-100">
                            <div className="flex">
                                {dateRange.slice(0, 62).map((date, index) => {
                                    const day = parseInt(format(date, 'dd'));
                                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                    const isWeekend = [0, 6].includes(date.getDay());

                                    return (
                                        <div
                                            key={index}
                                            className={`flex-shrink-0 text-center border-r border-gray-100 ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : ''
                                                }`}
                                            style={{ width: dayWidth }}
                                        >
                                            <div className={`text-xs py-2 ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'
                                                }`}>
                                                {day.toString().padStart(2, '0')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Gantt Chart Body */}
                    <div className="relative">
                        {tasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No tasks to display</p>
                            </div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {/* Render project rows */}
                                {projects.map((project) => {
                                    const projectTasks = tasks.filter(task => task.project_id === project.id);

                                    return (
                                        <div key={project.id}>
                                            {/* Project row - empty for spacing */}
                                            <div className="h-10"></div>

                                            {/* Task rows */}
                                            {projectTasks.map((task) => {
                                                const position = getTaskPosition(task);

                                                return (
                                                    <div key={task.id} className="relative h-10 flex items-center">
                                                        <div
                                                            className={`absolute h-6 rounded-sm opacity-90 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2 ${getStatusColor(task.status)}`}
                                                            style={{
                                                                left: position.left,
                                                                width: position.width,
                                                            }}
                                                            title={`${task.name} (${format(new Date(task.start_date), 'MM/dd/yyyy')} - ${format(new Date(task.end_date), 'MM/dd/yyyy')})`}
                                                        >
                                                            <span className="text-white text-xs font-medium truncate">
                                                                {task.name}
                                                            </span>
                                                        </div>

                                                        {/* Progress overlay */}
                                                        <div
                                                            className="absolute top-2 h-6 bg-white bg-opacity-30 rounded-sm"
                                                            style={{
                                                                left: position.left,
                                                                width: position.width * (task.progress / 100)
                                                            }}
                                                        ></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Today indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                            style={{
                                left: dateRange.findIndex(date =>
                                    format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ) * dayWidth
                            }}
                        >
                            <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Panel */}
            <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Calendar className="w-4 h-4" />
                            Attachments
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Users className="w-4 h-4" />
                            Task time tracker
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-500">Apps</span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            <TrendingUp className="w-4 h-4" />
                            Learning center
                        </button>
                        <span className="text-sm text-gray-500">Support</span>
                    </div>
                </div>
            </div>
        </div>
    );
}