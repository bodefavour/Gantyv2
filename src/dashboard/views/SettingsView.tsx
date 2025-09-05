// ...existing code...
import { User, Bell, Shield, CreditCard, Users, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsView() {
  const { user, signOut } = useAuth();

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      description: 'Manage your personal information and preferences',
      items: ['Personal Information', 'Profile Picture', 'Password']
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how and when you receive notifications',
      items: ['Email Notifications', 'Push Notifications', 'Project Updates']
    },
    {
      title: 'Security',
      icon: Shield,
      description: 'Manage security settings and two-factor authentication',
      items: ['Two-Factor Authentication', 'Session Management', 'API Keys']
    },
    {
      title: 'Billing',
      icon: CreditCard,
      description: 'Manage your subscription and billing information',
      items: ['Subscription Plan', 'Payment Methods', 'Billing History']
    },
    {
      title: 'Team Management',
      icon: Users,
      description: 'Manage team members and workspace settings',
      items: ['Team Members', 'Roles & Permissions', 'Workspace Settings']
    },
    {
      title: 'Integrations',
      icon: Globe,
      description: 'Connect with external tools and services',
      items: ['Google Workspace', 'Slack', 'Microsoft Teams']
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </h3>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500">Member since {new Date(user?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {settingsSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-gray-600 mb-4">{section.description}</p>
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border border-red-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
            <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors ml-4">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}