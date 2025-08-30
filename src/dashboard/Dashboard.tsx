import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import ProjectsView from './views/ProjectsView.tsx';
import GanttView from './views/GanttView.tsx';
import PortfoliosView from './views/PortfoliosView.tsx';
import TasksView from './views/TasksView.tsx';
import ReportsView from './views/ReportsView.tsx';
import WorkloadView from './views/WorkloadView.tsx';
import SettingsView from './views/SettingsView';

export default function Dashboard() {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<ProjectsView />} />
                        <Route path="/projects" element={<ProjectsView />} />
                        <Route path="/projects/:projectId/gantt" element={<GanttView />} />
                        <Route path="/portfolios" element={<PortfoliosView />} />
                        <Route path="/tasks" element={<TasksView />} />
                        <Route path="/reports" element={<ReportsView />} />
                        <Route path="/workload" element={<WorkloadView />} />
                        <Route path="/settings" element={<SettingsView />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}