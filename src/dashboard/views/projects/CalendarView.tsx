import React from 'react';
import { ChevronLeft, ChevronRight, Filter, User } from 'lucide-react';
import { format, getDaysInMonth, getDay, startOfMonth, addDays } from 'date-fns';

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

interface CalendarViewProps {
    tasks: Task[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export default function CalendarView({ tasks, currentDate, onDateChange }: CalendarViewProps) {
    const currentMonth = format(currentDate, 'MMMM yyyy');
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getDay(startOfMonth(currentDate));
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    // Add days from next month to fill the grid
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    const remainingCells = totalCells - (daysInMonth + firstDayOfMonth);
    for (let day = 1; day <= remainingCells; day++) {
        days.push(`next-${day}`);
    }

    const getTasksForDay = (day: number) => {
        const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');
        return tasks.filter(task =>
            dateStr >= task.start_date && dateStr <= task.end_date
        );
    };

    const goToPreviousMonth = () => {
        onDateChange(addDays(currentDate, -30));
    };

    const goToNextMonth = () => {
        onDateChange(addDays(currentDate, 30));
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    return (
        <div className="flex-1 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">{currentMonth}</h2>
                    <button
                        onClick={goToNextMonth}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="text-sm text-gray-600 hover:text-gray-900 ml-4 transition-colors"
                    >
                        Today
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        Missing a feature?
                    </button>
                </div>
                <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {days.map((day, index) => {
                        const isCurrentMonth = typeof day === 'number';
                        const isToday = isCurrentMonth && day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();
                        const dayTasks = isCurrentMonth ? getTasksForDay(day as number) : [];

                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] border-r border-b border-gray-200 last:border-r-0 p-2 ${!isCurrentMonth ? 'bg-gray-50' : ''
                                    } ${isToday ? 'bg-blue-50' : ''}`}
                            >
                                {day && (
                                    <>
                                        <div className={`text-sm font-medium mb-2 ${!isCurrentMonth ? 'text-gray-400' :
                                                isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                                            }`}>
                                            {typeof day === 'number' ? day : day.toString().split('-')[1]}
                                        </div>
                                        {isCurrentMonth && dayTasks.map((task) => (
                                            <div key={task.id} className="bg-teal-500 text-white text-xs p-1 rounded mb-1 truncate">
                                                <User className="w-3 h-3 inline mr-1" />
                                                {task.name}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}