import { Users, Calendar, BarChart3 } from 'lucide-react';

export default function WorkloadView() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Workload</h1>
                <div className="flex items-center gap-4">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option>This month</option>
                        <option>Next month</option>
                        <option>This quarter</option>
                    </select>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Team Capacity</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">85%</div>
                    <div className="text-sm text-gray-600">Average utilization</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-6 h-6 text-green-600" />
                        <h3 className="font-semibold text-gray-900">Overallocated</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">3</div>
                    <div className="text-sm text-gray-600">Team members</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">Available Hours</h3>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">240</div>
                    <div className="text-sm text-gray-600">This month</div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Team Member Workload</h3>
                </div>

                <div className="p-6">
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No workload data available</p>
                        <p className="text-gray-400 text-sm mt-2">Add team members and assign tasks to see workload distribution</p>
                    </div>
                </div>
            </div>
        </div>
    );
}