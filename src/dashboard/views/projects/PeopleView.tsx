import { Search, UserPlus, ChevronDown } from 'lucide-react';

interface WorkspaceMember {
    id: string;
    user_id: string;
    role: string;
    profiles: {
    first_name: string | null;
    last_name: string | null;
        email: string;
    };
}

interface PeopleViewProps {
    members: WorkspaceMember[];
    onInviteUser: () => void;
}

export default function PeopleView({ members, onInviteUser }: PeopleViewProps) {
    return (
        <div className="flex-1 p-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-8 mb-6">
                <button className="text-lg font-medium text-gray-900 border-b-2 border-blue-500 pb-2">
                    People
                </button>
                <button className="text-lg font-medium text-gray-500 pb-2 hover:text-gray-700 transition-colors">
                    Virtual resources
                </button>
            </div>

            {/* Description */}
            <div className="mb-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                    Here you manage all your project members. You can invite new participants by email or choose from the already invited
                    team members. Depending on project rights granted, team members may have different features in projects.
                </p>

                {/* Search and Invite */}
                <div className="flex items-center justify-between">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name or email"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        onClick={onInviteUser}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite users
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-700 bg-gray-50">
                    <span>User</span>
                    <span>Project rights</span>
                    <span>Type</span>
                </div>

                {/* Members List */}
                {members.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 mb-4">No team members found</p>
                        <button
                            onClick={onInviteUser}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Invite your first team member
                        </button>
                    </div>
                ) : (
                    members.map((member) => (
                        <div key={member.id} className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                            {/* User Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {(member.profiles.first_name?.charAt(0) || member.profiles.email.charAt(0)).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {member.profiles.first_name || ''} {member.profiles.last_name || ''}
                                    </div>
                                    <div className="text-sm text-gray-500">{member.profiles.email}</div>
                                </div>
                            </div>

                            {/* Project Rights */}
                            <div className="flex items-center">
                                <span className="font-medium text-gray-900 capitalize">
                                    {member.role.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Type and Actions */}
                            <div className="flex items-center justify-between">
                                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                    per hour <ChevronDown className="w-4 h-4" />
                                </button>
                                {member.role === 'owner' && (
                                    <button className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                                        Change project owner
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}