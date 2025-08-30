import { CheckSquare, Filter, Download, Plus, MoreHorizontal } from 'lucide-react';

export default function TasksView() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My tasks</h1>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Number of tasks: 0</span>
                            <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                                My incomplete tasks
                            </button>
                            <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                                Missing a feature?
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
                            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-4">
                        <span>Task name</span>
                        <span>Project</span>
                        <span>Start date</span>
                        <span>Assigned</span>
                        <span>Status</span>
                        <span>Time log</span>
                        <span></span>
                    </div>

                    <div className="text-center py-16">
                        <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">There are no tasks in the project</p>
                    </div>
                </div>
            </div>
        </div>
    );
}