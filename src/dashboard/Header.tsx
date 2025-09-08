import { useWorkspace } from '../contexts/WorkspaceContext';

export default function Header() {
    const { currentWorkspace } = useWorkspace();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {currentWorkspace?.name || 'Dashboard'}
                    </h1>
                </div>

                <div />
            </div>
        </header>
    );
}