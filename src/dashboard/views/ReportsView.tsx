import { BarChart3, TrendingUp, Users, Calendar, Download } from 'lucide-react';

export default function ReportsView() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Report Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                        <span className="text-sm text-green-600 font-medium">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">24</div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">+8%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">87%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-purple-600" />
                        <span className="text-sm text-blue-600 font-medium">+3</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">156</div>
                    <div className="text-sm text-gray-600">Team Members</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8 text-orange-600" />
                        <span className="text-sm text-red-600 font-medium">-2 days</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">3.2</div>
                    <div className="text-sm text-gray-600">Avg. Delay (days)</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress Overview</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization coming soon
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Workload Distribution</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization coming soon
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization coming soon
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Analysis</h3>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization coming soon
                    </div>
                </div>
            </div>
        </div>
    );
}