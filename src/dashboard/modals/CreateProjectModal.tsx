import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import toast from 'react-hot-toast';

type Project = Database['public']['Tables']['projects']['Insert'];

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (project: any) => void;
}

export default function CreateProjectModal({ open, onClose, onSuccess }: CreateProjectModalProps) {
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        color: '#3B82F6',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !currentWorkspace) {
            toast.error('User not authenticated or no workspace selected');
            return;
        }

        setLoading(true);
        try {
            const projectData: Project = {
                workspace_id: currentWorkspace.id,
                name: formData.name,
                description: formData.description || null,
                start_date: formData.start_date,
                end_date: formData.end_date || null,
                color: formData.color,
                created_by: user.id,
            };

            const { data, error } = await (supabase as any)
                .from('projects')
                .insert(projectData)
                .select()
                .single();

            if (error) throw error;

            toast.success('Project created successfully!');
            onSuccess?.(data);
            onClose();
            setFormData({
                name: '',
                description: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                color: '#3B82F6',
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name *
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter project name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter project description"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date *
                            </label>
                            <input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                            Project Color
                        </label>
                        <input
                            id="color"
                            type="color"
                            value={formData.color}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="w-20 h-10 border border-gray-300 rounded-md"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}