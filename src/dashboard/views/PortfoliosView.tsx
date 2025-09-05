import React from 'react';
import { Plus, Briefcase } from 'lucide-react';

export default function PortfoliosView() {
    return (
        <div className="p-6">
            <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Get a high-level picture of your projects with portfolios
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Manage plans, resources, and budgets and analyze risks across multiple projects.
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Create
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Team building</h3>
                </div>

                <div className="flex border-b border-gray-200 mb-6">
                    {['Projects', 'Gantt Chart', 'List', 'Workload', 'Dashboard'].map((tab, index) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 text-sm font-medium border-b-2 ${index === 0
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                        <span>Project name</span>
                        <div className="flex items-center gap-16">
                            <span>Status</span>
                            <span>Progress</span>
                            <span>Start date</span>
                            <span>End date</span>
                        </div>
                    </div>

                    <div className="text-center py-8 text-gray-500">
                        No projects in this portfolio yet
                    </div>
                </div>
            </div>
        </div>
    );
}