import { useState } from 'react';
import {
    ArrowLeft,
    X,
    Users,
    ChevronDown,
    Filter,
    Download,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export default function WorkloadView() {
    const [mode, setMode] = useState('Hours');
    const [range, setRange] = useState('3 months');

    // Generate calendar days for July and August 2025
    const generateCalendarDays = () => {
        const days = [];

        // July 2025 (last day only)
        days.push({ date: 30, month: 'July', isCurrentMonth: false });
        days.push({ date: 31, month: 'July', isCurrentMonth: false });

        // August 2025 (full month)
        for (let i = 1; i <= 26; i++) {
            days.push({ date: i, month: 'August', isCurrentMonth: true });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const teamMembers = [
        {
            id: 1,
            name: 'Azeem Dev',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            color: 'bg-teal-500',
            hours: Array(28).fill(0)
        },
        {
            id: 2,
            name: 'Azeem Olunloye',
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            color: 'bg-red-500',
            hours: Array(28).fill(0)
        },
        {
            id: 3,
            name: 'unassigned',
            avatar: null,
            color: 'bg-gray-400',
            hours: Array(28).fill(0)
        }
    ];

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
                            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                <Users className="w-3 h-3 text-gray-600" />
                            </div>
                            <h1 className="text-lg font-medium text-gray-900">Workload</h1>
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Mode:</span>
                            <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 transition-colors">
                                <span>{mode}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Range:</span>
                            <button className="flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 transition-colors">
                                <span>{range}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                            Missing a feature?
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded">
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
            <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex">
                    {/* Resource column header */}
                    <div className="w-48 px-4 py-3 border-r border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Resource</span>
                    </div>

                    {/* Calendar days header */}
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex">
                            {/* Month headers */}
                            <div className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
                                <span>July 2025</span>
                            </div>
                            <div className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200 flex-1">
                                <span>August 2025</span>
                            </div>
                        </div>

                        {/* Day numbers */}
                        <div className="flex">
                            {calendarDays.map((day, index) => (
                                <div
                                    key={index}
                                    className={`w-8 h-8 flex items-center justify-center text-xs border-r border-gray-200 ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : 'text-gray-700'
                                        }`}
                                >
                                    {day.date.toString().padStart(2, '0')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List */}
            <div className="flex-1 overflow-auto">
                <div className="divide-y divide-gray-100">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex hover:bg-gray-50 transition-colors">
                            {/* Resource column */}
                            <div className="w-48 px-4 py-3 border-r border-gray-200">
                                <div className="flex items-center gap-3">
                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {member.avatar ? (
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center`}>
                                                <Users className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                                    </div>

                                    <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Hours grid */}
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex">
                                    {member.hours.map((hours, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className="w-8 h-12 flex items-center justify-center text-xs text-gray-600 border-r border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                                        >
                                            {hours}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Navigation */}
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