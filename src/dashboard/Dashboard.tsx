import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProjectsView from './views/ProjectsView';
import GanttView from './views/GanttView';
import PortfoliosView from './views/PortfoliosView';
import TasksView from './views/TasksView';
import ReportsView from './views/ReportsView';
import WorkloadView from './views/WorkloadView';
import CommunicationView from './views/CommunicationView';
import SettingsView from './views/SettingsView';
import BillingView from './views/BillingView';
import TimeLogView from './views/TimeLogView';
import TrialGate from '../components/billing/TrialGate';

export default function Dashboard() {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-auto">
                    <TrialGate>
                        <Routes>
                            <Route path="/" element={<ProjectsView />} />
                            <Route path="/projects" element={<ProjectsView />} />
                            <Route path="/projects/:projectId/gantt" element={<GanttView />} />
                            <Route path="/portfolios" element={<PortfoliosView />} />
                            <Route path="/my-tasks" element={<TasksView />} />
                            <Route path="/my-time-log" element={<TimeLogView />} />
                            <Route path="/reports" element={<ReportsView />} />
                            <Route path="/workload" element={<WorkloadView />} />
                            <Route path="/communication" element={<CommunicationView />} />
                            <Route path="/settings" element={<SettingsView />} />
                            <Route path="/billing" element={<BillingView />} />
                        </Routes>
                    </TrialGate>
                </main>
            </div>
        </div>
    );
}