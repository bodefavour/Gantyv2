import { useState } from 'react';
import { Plus, Settings, Filter, Download, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
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

interface ListViewProps {
    tasks: Task[];
    onAddTask: () => void;
    onAddMilestone: () => void;
}

export default function ListView({ tasks, onAddTask, onAddMilestone }: ListViewProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [showCustomFields, setShowCustomFields] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'in_progress': return 'text-blue-600';
            case 'on_hold': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'not_started': return 'Open';
            case 'in_progress': return 'In Progress';
            case 'completed': return 'Completed';
            case 'on_hold': return 'On Hold';
            default: return 'Open';
        }
    };

    return (
        <div className="flex-1">
            {/* Toolbar */}
            <div className="border-b border-gray-200 px-6 py-3 space-y-3">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add new
                    </button>
                    <div className="flex items-center gap-4 ml-auto">
                        <button
                            onClick={() => {
                                setShowCustomFields(v => !v);
                                toast.success(!showCustomFields ? 'Custom fields panel opened' : 'Custom fields panel hidden');
                            }}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Custom fields
                        </button>
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button
                            onClick={() => {
                                try {
                                    const rows = filtered.map(t => ({ id: t.id, name: t.name, start_date: t.start_date, end_date: t.end_date, status: t.status }));
                                    const header = 'id,name,start_date,end_date,status\n';
                                    const body = rows.map(r => [r.id, '"' + r.name.replace(/"/g,'""') + '"', r.start_date, r.end_date, r.status].join(',')).join('\n');
                                    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url; a.download = 'tasks_list_export.csv'; a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success('Exported CSV');
                                } catch (e) {
                                    console.error(e);
                                    toast.error('Export failed');
                                }
                            }}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <span className="text-sm text-gray-500">View</span>
                    </div>
                </div>
                {(showFilters || showCustomFields) && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        {showFilters && (
                            <>
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search tasks"
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <button
                                    onClick={() => { setSearch(''); toast('Filters cleared'); }}
                                    className="text-gray-600 hover:text-gray-900"
                                >Reset</button>
                            </>
                        )}
                        {showCustomFields && (
                            <div className="text-gray-500 italic">Custom fields area (future implementation)</div>
                        )}
                    </div>
                )}
            </div>

            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 px-6 py-3 text-sm font-medium text-gray-700">
                    <span>Task name</span>
                    <span>Start date</span>
                    <span>Assigned</span>
                    <span>Status</span>
                    <span>Time log</span>
                    <div></div>
                </div>
            </div>

            {/* Task List */}
            <div className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 mb-4">No tasks found</p>
                        <button
                            onClick={onAddTask}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Add your first task
                        </button>
                    </div>
                ) : (
                    <>
                        {filtered.map((task) => (
                            <div key={task.id} className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-teal-500 rounded"></div>
                                    <span className="font-medium text-gray-900">{task.name}</span>
                                </div>
                                <span className="text-gray-600 text-sm flex items-center">
                                    {format(new Date(task.start_date), 'MM/dd/yyyy')}
                                </span>
                                <span className="text-gray-600 text-sm flex items-center">
                                    {task.assigned_to ? 'Assigned' : 'unassigned'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <span className={`text-sm ${getStatusColor(task.status)}`}>
                                        {getStatusText(task.status)}
                                    </span>
                                </div>
                                <span className="text-gray-600 text-sm flex items-center">0</span>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => {
                                            const choice = window.prompt('1. Add subtask\n2. Convert to milestone\n3. Delete task\nEnter choice (1-3):');
                                            if (choice === '2') {
                                                toast('Milestone conversion pending schema feature');
                                            } else if (choice === '3') {
                                                toast('Delete from List view not yet wired');
                                            }
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Add Task/Milestone Actions */}
                <div className="px-6 py-4 space-y-2">
                    <button
                        onClick={onAddTask}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add a task
                    </button>
                    <button
                        onClick={onAddMilestone}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add a milestone
                    </button>
                </div>
            </div>
        </div>
    );
}