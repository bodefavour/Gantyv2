import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function Header() {
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {currentWorkspace?.name || 'Dashboard'}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            1
                        </span>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}