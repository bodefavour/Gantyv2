import React from 'react';
import { ChevronDown, User } from 'lucide-react';
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
    updated_at: string;
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

interface DashboardViewProps {
    projects: Project[];
    tasks: Task[];
    members: WorkspaceMember[];
}

export default function DashboardView({ projects, tasks, members }: DashboardViewProps) {
    const currentProject = projects[0]; // Assuming we're viewing the first project
    const projectTasks = tasks.filter(task => task.project_id === currentProject?.id);

    // Calculate task statistics
    const taskStats = {
        open: projectTasks.filter(task => task.status === 'not_started').length,
        inProgress: projectTasks.filter(task => task.status === 'in_progress').length,
        completed: projectTasks.filter(task => task.status === 'completed').length,
        onHold: projectTasks.filter(task => task.status === 'on_hold').length,
    };

    const totalTasks = projectTasks.length;
    const completedPercentage = totalTasks > 0 ? Math.round((taskStats.completed / totalTasks) * 100) : 0;

    // Get project owner
    const projectOwner = members.find(member => member.role === 'owner');

    return (
        <div className="flex-1 p-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        <span>Actual to planned</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        Missing a feature?
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                        Manage widgets
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Info & Description */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project info & description</h3>

                    <div className="mb-6">
                        <p className="text-gray-500 italic">Add project description</p>
                    </div>

                    <div className="space-y-4">
                        {/* Project Owner */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Project owner</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {projectOwner ? projectOwner.profiles.first_name.charAt(0) + projectOwner.profiles.last_name.charAt(0) : 'FB'}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {projectOwner ? `${projectOwner.profiles.first_name} ${projectOwner.profiles.last_name}` : 'Favour Bode'}
                                </span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Progress: {completedPercentage}%</span>
                        </div>

                        {/* Team */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Team</span>
                            <div className="flex items-center gap-1">
                                {members.slice(0, 3).map((member, index) => (
                                    <div key={member.id} className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {member.profiles.first_name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div>
                                <span className="text-sm text-gray-600 block">Start date</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {currentProject ? format(new Date(currentProject.start_date), 'MM/dd/yyyy') : '09/08/2025'}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 block">End date</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {currentProject && currentProject.end_date ? format(new Date(currentProject.end_date), 'MM/dd/yyyy') : '09/09/2025'}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 block">Last change</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {currentProject ? format(new Date(currentProject.updated_at || currentProject.created_at), 'MM/dd/yyyy') : '09/08/2025'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time on Tasks */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Time on tasks</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ACTUAL TO PLANNED</span>
                    </div>

                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-gray-500 mb-4">Track project variance in working hours.</p>
                            <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-400 text-sm">No data</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>

                    <div className="flex items-center justify-center h-64">
                        <div className="relative">
                            {/* Donut Chart */}
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    {totalTasks > 0 ? (
                                        <>
                                            {/* Open tasks (gray) */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="35"
                                                fill="none"
                                                stroke="#9CA3AF"
                                                strokeWidth="15"
                                                strokeDasharray={`${(taskStats.open / totalTasks) * 220} 220`}
                                                strokeDashoffset="0"
                                            />
                                            {/* In Progress tasks (blue) */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="35"
                                                fill="none"
                                                stroke="#3B82F6"
                                                strokeWidth="15"
                                                strokeDasharray={`${(taskStats.inProgress / totalTasks) * 220} 220`}
                                                strokeDashoffset={`-${(taskStats.open / totalTasks) * 220}`}
                                            />
                                            {/* Completed tasks (green) */}
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="35"
                                                fill="none"
                                                stroke="#10B981"
                                                strokeWidth="15"
                                                strokeDasharray={`${(taskStats.completed / totalTasks) * 220} 220`}
                                                strokeDashoffset={`-${((taskStats.open + taskStats.inProgress) / totalTasks) * 220}`}
                                            />
                                        </>
                                    ) : (
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="35"
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="15"
                                        />
                                    )}
                                </svg>
                            </div>

                            {/* Legend */}
                            <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-8 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                                    <span className="text-gray-700">Open</span>
                                </div>
                                {taskStats.inProgress > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                        <span className="text-gray-700">In Progress</span>
                                    </div>
                                )}
                                {taskStats.completed > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                        <span className="text-gray-700">Completed</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty Widget Placeholder */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                            </div>
                            <p className="text-gray-500 text-sm">Add more widgets to customize your dashboard</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}