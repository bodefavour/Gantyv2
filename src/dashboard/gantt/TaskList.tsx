import { Plus, MoreHorizontal, Circle, CheckCircle } from 'lucide-react';

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

interface TaskListProps {
    tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
    const getStatusIcon = (status: string, progress: number) => {
        if (status === 'completed' || progress === 100) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        return <Circle className="w-4 h-4 text-gray-400" />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'in_progress': return 'text-blue-600';
            case 'on_hold': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
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

            {/* Task List */}
            <div className="flex-1 overflow-auto">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No tasks in this project</p>
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors mx-auto">
                            <Plus className="w-4 h-4" />
                            Add a task
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {tasks.map((task, index) => (
                            <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(task.status, task.progress)}
                                            <span className="font-medium text-gray-900 truncate">{task.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="w-20 text-gray-500 truncate">
                                            {task.assigned_to ? 'Assigned' : 'Unassigned'}
                                        </span>
                                        <span className={`w-16 ${getStatusColor(task.status)}`}>
                                            {task.status === 'not_started' ? 'Open' : task.status.replace('_', ' ')}
                                        </span>
                                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Task Row */}
                        <div className="px-4 py-3">
                            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm">
                                <Plus className="w-4 h-4" />
                                Add a task
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}