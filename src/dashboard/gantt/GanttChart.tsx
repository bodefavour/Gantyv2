import { useMemo } from 'react';
import { format, addDays, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Calendar } from 'lucide-react';

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

interface GanttChartProps {
    tasks: Task[];
}

export default function GanttChart({ tasks }: GanttChartProps) {
    const { dateRange, dayWidth } = useMemo(() => {
        if (tasks.length === 0) {
            const today = new Date();
            const start = startOfMonth(today);
            const end = endOfMonth(addDays(today, 90));
            return {
                dateRange: eachDayOfInterval({ start, end }),
                dayWidth: 40
            };
        }

        const startDates = tasks.map(task => new Date(task.start_date));
        const endDates = tasks.map(task => new Date(task.end_date));

        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));

        const start = startOfMonth(minDate);
        const end = endOfMonth(addDays(maxDate, 30));

        return {
            dateRange: eachDayOfInterval({ start, end }),
            dayWidth: 40
        };
    }, [tasks]);

    const getTaskPosition = (task: Task) => {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);
        const startIndex = dateRange.findIndex(date =>
            format(date, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
        );
        const duration = differenceInDays(endDate, startDate) + 1;

        return {
            left: startIndex * dayWidth,
            width: duration * dayWidth,
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'on_hold': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-gray-50">
            {/* Timeline Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="h-16 flex items-center border-b border-gray-100">
                    <div className="flex" style={{ width: dateRange.length * dayWidth }}>
                        {dateRange.map((date, index) => {
                            const isFirstOfMonth = format(date, 'dd') === '01';
                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <div
                                    key={index}
                                    className={`flex-shrink-0 border-r border-gray-100 text-center ${isToday ? 'bg-blue-50' : ''
                                        }`}
                                    style={{ width: dayWidth }}
                                >
                                    <div className="text-xs text-gray-500 py-1">
                                        {isFirstOfMonth && format(date, 'MMM')}
                                    </div>
                                    <div className={`text-sm py-1 ${isToday ? 'font-bold text-blue-600' : 'text-gray-700'
                                        }`}>
                                        {format(date, 'dd')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Gantt Chart Body */}
            <div className="relative">
                {tasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks to display</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {tasks.map((task) => {
                            const position = getTaskPosition(task);

                            return (
                                <div key={task.id} className="relative h-8 flex items-center">
                                    <div
                                        className={`absolute h-6 rounded-md ${getStatusColor(task.status)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                                        style={{
                                            left: position.left,
                                            width: position.width,
                                        }}
                                    >
                                        <div className="h-full flex items-center px-2">
                                            <span className="text-white text-xs font-medium truncate">
                                                {task.name}
                                            </span>
                                        </div>

                                        {/* Progress overlay */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded-md"
                                            style={{ width: `${task.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Today indicator */}
                <div className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                    style={{
                        left: dateRange.findIndex(date =>
                            format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        ) * dayWidth
                    }}>
                    <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}