import React, { useState } from 'react';
import {
    ArrowLeft,
    X,
    MessageSquare,
    ChevronDown,
    Search,
    MoreHorizontal,
    User
} from 'lucide-react';

export default function CommunicationView() {
    const [selectedProject, setSelectedProject] = useState('all projects');
    const [activeTab, setActiveTab] = useState('all-tasks');
    const [selectedTask, setSelectedTask] = useState('Summary task');

    const tabs = [
        { id: 'all-tasks', name: 'All tasks', active: true },
        { id: 'with-comments', name: 'With new comments', active: false },
        { id: 'mentioned', name: "I'm mentioned", active: false },
        { id: 'assigned', name: "I'm assigned", active: false },
        { id: 'creator', name: "I'm creator of task", active: false },
    ];

    const tasks = [
        {
            id: 1,
            name: 'Summary task',
            assignee: 'Azeem',
            project: 'Azeem',
            isSelected: true
        },
        {
            id: 2,
            name: 'Summary task',
            assignee: 'Azeem',
            project: 'Azeem',
            isSelected: false
        },
        {
            id: 3,
            name: 'Summary task',
            assignee: 'Azeem',
            project: 'Azeem',
            isSelected: false
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
                            <MessageSquare className="w-5 h-5 text-gray-600" />
                            <h1 className="text-lg font-medium text-gray-900">Communication hub</h1>
                        </div>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <span>{selectedProject}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by task name or comment"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
                <div className="flex items-center gap-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Task List */}
                <div className="w-80 border-r border-gray-200 bg-gray-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">Task</h3>
                            <h3 className="font-medium text-gray-900">{selectedTask}</h3>
                        </div>

                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`p-3 rounded cursor-pointer transition-colors ${task.isSelected ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
                                        }`}
                                    onClick={() => setSelectedTask(task.name)}
                                >
                                    <div className={`font-medium mb-1 ${task.isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        {task.name}
                                    </div>
                                    <div className={`text-sm flex items-center gap-1 ${task.isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                                        <User className="w-3 h-3" />
                                        <span>{task.assignee}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Task Details */}
                    <div className="px-4 pb-4">
                        {tasks.filter(task => !task.isSelected).map((task) => (
                            <div key={`detail-${task.id}`} className="mb-4">
                                <div className="font-medium text-gray-900 mb-1">{task.assignee}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3" />
                                    <span>{task.assignee}</span>
                                </div>
                                <div className="text-sm text-gray-500">▸ {task.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            {/* Comment illustration */}
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                {/* Speech bubbles */}
                                <div className="absolute top-4 left-8 w-16 h-12 bg-gray-200 rounded-lg transform rotate-12"></div>
                                <div className="absolute top-8 right-4 w-20 h-14 bg-gray-300 rounded-lg transform -rotate-6"></div>
                                <div className="absolute bottom-4 left-4 w-18 h-10 bg-gray-100 rounded-lg transform rotate-3"></div>

                                {/* Pencil */}
                                <div className="absolute bottom-2 right-2 w-8 h-1 bg-yellow-400 rounded transform rotate-45"></div>
                                <div className="absolute bottom-1 right-1 w-2 h-2 bg-pink-400 rounded-full"></div>
                            </div>

                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                You don't have any comments yet
                            </h3>
                            <p className="text-gray-600 mb-8">
                                Leave your first message in the dialogue below
                            </p>

                            {/* Comment Input */}
                            <div className="flex items-center gap-3 max-w-md mx-auto">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    AO
                                </div>
                                <input
                                    type="text"
                                    placeholder="Leave a comment"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Task Settings */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium">
                            Open task settings
                        </button>
                    </div>
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