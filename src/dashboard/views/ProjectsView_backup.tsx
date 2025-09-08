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
    Download,
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
import { supabaseAdmin } from '../../lib/supabase-admin';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

// Import view components
import GanttView from './projects/GanttView';
import BoardView from './projects/BoardView';
import ListView from './projects/ListView';
import CalendarView from './projects/CalendarView';
import WorkloadView from './projects/WorkloadView';
import PeopleView from './projects/PeopleView';
import CreateProjectModal from '../modals/CreateProjectModal';

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

interface WorkspaceMember {
    id: string;
    user_id: string;
    role: string;
    profiles: {
        first_name: string;
        last_name: string;
        email: string;
    };
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
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('gantt');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [newTaskName, setNewTaskName] = useState('');
    const [addingTask, setAddingTask] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

    useEffect(() => {
        if (currentWorkspace && user) {
            fetchData();
        }
    }, [currentWorkspace, user]);

    const fetchData = async () => {
        if (!currentWorkspace || !user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Fetch projects
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .order('created_at', { ascending: false });

            if (projectsError) throw projectsError;
            setProjects(projectsData || []);

            // Fetch tasks
            if (projectsData && projectsData.length > 0) {
                const projectIds = projectsData.map(p => p.id);
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('created_at', { ascending: false });

                if (tasksError) throw tasksError;
                setTasks(tasksData || []);
            } else {
                setTasks([]);
            }

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast.error(`Failed to load projects: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (!newTaskName.trim()) {
            toast.error('Please enter a task name');
            return;
        }

        if (!selectedProject) {
            const targetProject = projects[0];
            if (!targetProject) {
                toast.error('No project selected. Please create a project first.');
                return;
            }
            setSelectedProject(targetProject.id);
        }

        if (!user) {
            toast.error('User not authenticated');
            return;
        }

        try {
            setAddingTask(true);
            
            const taskData = {
                name: newTaskName,
                project_id: selectedProject || projects[0]?.id,
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                duration: 7,
                progress: 0,
                status: 'pending',
                priority: 'medium',
                workspace_id: currentWorkspace?.id,
            };

            const { data, error } = await supabase
                .from('tasks')
                .insert([taskData])
                .select()
                .single();

            if (error) throw error;

            setTasks(prev => [data, ...prev]);
            setNewTaskName('');
            
            const targetProject = projects.find(p => p.id === (selectedProject || projects[0]?.id));
            toast.success(`Task "${newTaskName}" added to ${targetProject?.name}`);
        } catch (error: any) {
            console.error('Error adding task:', error);
            toast.error(`Failed to add task: ${error.message || 'Unknown error'}`);
        } finally {
            setAddingTask(false);
        }
    };

    const createProject = async (projectName: string) => {
        if (!projectName.trim()) {
            toast.error('Please provide a project name');
            return;
        }

        if (!currentWorkspace || !user) return;

        try {
            const projectData = {
                name: projectName,
                description: null,
                workspace_id: currentWorkspace.id,
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                status: 'active',
                progress: 0,
                owner_id: user.id,
            };

            const client = supabaseAdmin || supabase;
            const { data, error } = await client
                .from('projects')
                .insert([projectData])
                .select()
                .single();

            if (error) throw error;

            setProjects(prev => [data, ...prev]);
            setShowCreateProjectModal(false);
            toast.success(`Project "${projectName}" created successfully`);
            
            // Auto-select the new project
            setSelectedProject(data.id);
        } catch (error: any) {
            console.error('Error creating project:', error);
            toast.error(`Failed to create project: ${error.message || 'Unknown error'}`);
        }
    };

    const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
        try {
            const taskName = tasks.find(t => t.id === taskId)?.name || 'Task';
            setTasks(prev => prev.map(task => 
                task.id === taskId ? { ...task, status: newStatus } : task
            ));
            toast.success('Task status updated successfully');
        } catch (error) {
            console.error('Error updating task status:', error);
            toast.error('Failed to update task status');
        }
    };

    const handleAddMilestone = () => {
        toast('Milestone feature coming soon!');
    };

    const handleInviteUser = () => {
        toast('Invite user functionality coming soon!');
    };

    // Function to render the appropriate view based on activeView
    const renderActiveView = () => {
        switch (activeView) {
            case 'gantt':
                return (
                    <GanttView 
                        projects={projects}
                        tasks={tasks}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        newTaskName={newTaskName}
                        setNewTaskName={setNewTaskName}
                        onAddTask={addTask}
                        addingTask={addingTask}
                    />
                );
            case 'board':
                return (
                    <BoardView 
                        tasks={tasks}
                        onUpdateTaskStatus={handleTaskStatusUpdate}
                        onAddTask={addTask}
                    />
                );
            case 'list':
                return (
                    <ListView 
                        tasks={tasks}
                        onAddTask={addTask}
                        onAddMilestone={handleAddMilestone}
                    />
                );
            case 'calendar':
                return (
                    <CalendarView 
                        tasks={tasks}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                    />
                );
            case 'workload':
                return (
                    <WorkloadView 
                        members={members}
                    />
                );
            case 'people':
                return (
                    <PeopleView 
                        members={members}
                        onInviteUser={handleInviteUser}
                    />
                );
            case 'dashboard':
                return (
                    <div className="flex-1 p-6 bg-gray-50">
                        <h2 className="text-xl font-semibold mb-4">Project Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Total Projects</h3>
                                <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Total Tasks</h3>
                                <p className="text-3xl font-bold text-green-600">{tasks.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-2">Completed Tasks</h3>
                                <p className="text-3xl font-bold text-purple-600">{tasks.filter(t => t.status === 'completed').length}</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">View not implemented yet</p>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading projects...</p>
                </div>
            </div>
        );
    }

    if (!currentWorkspace) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <BarChart3 className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspace Selected</h3>
                    <p className="text-gray-600">Please select or create a workspace to view projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Clean Project Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowCreateProjectModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Search className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Filter className="w-4 h-4" />
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

            {/* Main Content */}
            {renderActiveView()}

            {/* Create Project Modal */}
            <CreateProjectModal
                open={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                onSuccess={(project) => {
                    setProjects(prev => [project, ...prev]);
                    setShowCreateProjectModal(false);
                }}
            />
        </div>
    );
}
