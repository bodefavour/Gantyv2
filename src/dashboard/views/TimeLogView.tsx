import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    X,
    Clock,
    ChevronDown,
    RefreshCw,
    Filter,
    Download,
    MoreHorizontal,
    ArrowUpDown
} from 'lucide-react';

interface TimeEntry {
    id: string;
    task_name: string;
    project_name: string;
    date: string;
    time: string;
    comment: string;
}

export default function TimeLogView() {
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupBy, setGroupBy] = useState('date');

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                            <h1 className="text-lg font-medium text-gray-900">My time log</h1>
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-600">Total time spent: 0</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Group by</span>
                            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <span>{groupBy}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-5 gap-4 px-6 py-3 text-sm font-medium text-gray-700">
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
                        <span>Date</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Time</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Comment</span>
                        <button className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-16">
                    {/* Time tracking illustration */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        {/* Clock base */}
                        <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto relative">
                            {/* Clock face */}
                            <div className="absolute inset-2 bg-white rounded-full border-2 border-gray-300">
                                {/* Clock hands */}
                                <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-gray-600 transform -translate-x-1/2 -translate-y-full origin-bottom rotate-90"></div>
                                <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-gray-600 transform -translate-x-1/2 -translate-y-full origin-bottom rotate-180"></div>
                                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full"></div>
                        <div className="absolute -top-1 right-4 w-3 h-3 bg-purple-500 transform rotate-45"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-400 rounded-full"></div>
                        <div className="absolute bottom-2 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>

                    <p className="text-gray-500 text-lg">No filtered data. Please apply other filters</p>
                </div>
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