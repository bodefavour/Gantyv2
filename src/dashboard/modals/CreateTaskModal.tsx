import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { supabase } from '../../lib/supabase';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    parentTaskId?: string;
}

interface TeamMember {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
}

export default function CreateTaskModal({ isOpen, onClose, projectId, parentTaskId }: CreateTaskModalProps) {
    const { createTask } = useTasks(projectId);
    const [loading, setLoading] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        assigned_to: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        estimated_hours: '',
        is_milestone: false,
    });

    useEffect(() => {
        if (isOpen) {
            fetchTeamMembers();
        }
    }, [isOpen, projectId]);

    const fetchTeamMembers = async () => {
        try {
            // Get workspace members for the project
            const { data: project } = await (supabase as any)
                .from('projects')
                .select('workspace_id')
                .eq('id', projectId)
                .single();

            if (!project) return;

            const { data, error } = await (supabase as any)
                .from('workspace_members')
                .select(`
          profiles!workspace_members_user_id_fkey (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
                .eq('workspace_id', project.workspace_id);

            if (error) throw error;

            setTeamMembers(data.map((item: any) => item.profiles).filter(Boolean));
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createTask({
                name: formData.name,
                description: formData.description || undefined,
                start_date: formData.start_date,
                end_date: formData.end_date,
                parent_id: parentTaskId,
                assigned_to: formData.assigned_to || undefined,
                priority: formData.priority,
                estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
                is_milestone: formData.is_milestone,
            });

            onClose();
            setFormData({
                name: '',
                description: '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
                assigned_to: '',
                priority: 'medium',
                estimated_hours: '',
                is_milestone: false,
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {parentTaskId ? 'Create Subtask' : 'Create New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Enter task name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Task description (optional)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assigned To
                            </label>
                            <select
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.first_name} {member.last_name} ({member.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estimated Hours
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.estimated_hours}
                                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_milestone}
                                    onChange={(e) => setFormData({ ...formData, is_milestone: e.target.checked })}
                                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Mark as milestone</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : parentTaskId ? 'Create Subtask' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}