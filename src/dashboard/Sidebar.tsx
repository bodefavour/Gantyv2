import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Calendar,
    FolderOpen,
    Briefcase,
    CheckSquare,
    BarChart3,
    Users,
    MessageSquare,
    Settings,
    Plus,
    ChevronRight
} from 'lucide-react';

const navigation = [
    { name: 'All projects', href: '/dashboard/projects', icon: FolderOpen },
    { name: 'Portfolios', href: '/dashboard/portfolios', icon: Briefcase },
    { name: 'My tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Workload', href: '/dashboard/workload', icon: Users },
    { name: 'Communication hub', href: '/dashboard/communication', icon: MessageSquare },
];

export default function Sidebar() {
    const location = useLocation();
    const [daysLeft] = useState(14);

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-teal-600" />
                    <span className="text-xl font-bold text-gray-900">GANTY</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">Zeem</div>
            </div>

            {/* Create Project Button */}
            <div className="p-4">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create new project
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href ||
                            (item.href === '/dashboard/projects' && location.pathname === '/dashboard');

                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Trial Info */}
            <div className="p-4 border-t border-gray-200">
                <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Days left {daysLeft}</div>
                    <div className="text-xs text-green-600 mt-1">Trial period</div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-200">
                <Link
                    to="/dashboard/settings"
                    className="flex items-center gap-3 px-7 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Account settings
                    <ChevronRight className="w-4 h-4 ml-auto" />
                </Link>
            </div>
        </div>
    );
}