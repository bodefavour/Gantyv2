import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';

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

interface BoardViewProps {
    tasks: Task[];
    onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
    onAddTask: () => void;
}

export default function BoardView({ tasks, onUpdateTaskStatus, onAddTask }: BoardViewProps) {
    const columns = [
        {
            id: 'not_started',
            title: 'OPEN',
            count: tasks.filter(t => t.status === 'not_started').length,
            bgColor: 'bg-gray-50'
        },
        {
            id: 'in_progress',
            title: 'IN PROGRESS',
            count: tasks.filter(t => t.status === 'in_progress').length,
            bgColor: 'bg-yellow-50'
        },
        {
            id: 'completed',
            title: 'DONE',
            count: tasks.filter(t => t.status === 'completed').length,
            bgColor: 'bg-green-50'
        },
        {
            id: 'on_hold',
            title: 'CLOSED',
            count: tasks.filter(t => t.status === 'on_hold').length,
            bgColor: 'bg-red-50'
        },
    ];

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        onUpdateTaskStatus(taskId, newStatus);
    };

    return (
        <div className="flex-1 p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Group by:</span>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Status
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sort by:</span>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Creation date
                        </button>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                        Missing a feature?
                    </button>
                </div>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Board Columns */}
            <div className="grid grid-cols-4 gap-6">
                {columns.map((column) => (
                    <div
                        key={column.id}
                        className={`${column.bgColor} rounded-lg p-4 min-h-[500px]`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">{column.title}</h3>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                {column.count}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {tasks.filter(task => task.status === column.id).map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-white p-3 rounded-lg shadow-sm border cursor-move hover:shadow-md transition-shadow"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                >
                                    <div className="mb-2">
                                        <span className="text-sm text-gray-500 mb-1 block">Summary task</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-teal-500 rounded"></div>
                                            <span className="font-medium text-gray-900">{task.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span>MEDIUM</span>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        {format(new Date(task.start_date), 'MM/dd/yyyy')} - {format(new Date(task.end_date), 'MM/dd/yyyy')}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={onAddTask}
                                className="w-full text-left text-gray-500 hover:text-gray-700 text-sm py-2 px-3 rounded-lg hover:bg-white transition-colors"
                            >
                                + Add a task
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}