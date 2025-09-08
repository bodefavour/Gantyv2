import React from 'react';
import { ChevronDown, Filter, Download, MoreHorizontal, User } from 'lucide-react';
import { format, addDays } from 'date-fns';

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

interface WorkloadViewProps {
    members: WorkspaceMember[];
}

export default function WorkloadView({ members }: WorkloadViewProps) {
    const generateDates = () => {
        const dates = [];
        const start = new Date(2025, 8, 6); // September 6, 2025
        for (let i = 0; i < 30; i++) {
            dates.push(addDays(start, i));
        }
        return dates;
    };

    const dates = generateDates();

    return (
        <div className="flex-1">
            {/* Toolbar */}
            <div className="border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Mode:</span>
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                Hours <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Range:</span>
                            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                3 months <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            Missing a feature?
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Days</span>
                            <div className="w-16 h-1 bg-gray-200 rounded-full">
                                <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Header */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                    <div className="w-48 px-4 py-3 border-r border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Resource</span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex items-center justify-center py-2 text-sm font-medium text-gray-700">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs mr-4">Today</span>
                            <span>September 2025</span>
                        </div>
                        <div className="flex">
                            {dates.map((date, index) => (
                                <div key={index} className="w-8 text-center text-xs text-gray-600 border-r border-gray-200 py-1">
                                    {format(date, 'dd')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resource Rows */}
            <div className="divide-y divide-gray-100">
                {/* Team Members */}
                {members.slice(0, 1).map((member) => (
                    <div key={member.id} className="flex hover:bg-gray-50 transition-colors">
                        <div className="w-48 px-4 py-3 border-r border-gray-200">
                            <div className="flex items-center gap-3">
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {member.profiles.first_name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    Favour Bode
                                </span>
                                <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <div className="flex">
                                {dates.map((_, index) => (
                                    <div key={index} className="w-8 h-12 flex items-center justify-center text-xs text-gray-600 border-r border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                        0
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Unassigned */}
                <div className="flex hover:bg-gray-50 transition-colors">
                    <div className="w-48 px-4 py-3 border-r border-gray-200">
                        <div className="flex items-center gap-3">
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">unassigned</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex">
                            {dates.map((_, index) => (
                                <div key={index} className="w-8 h-12 flex items-center justify-center text-xs text-gray-600 border-r border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer">
                                    0
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}