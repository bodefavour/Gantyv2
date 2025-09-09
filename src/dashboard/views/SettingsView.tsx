// ...existing code...
import { useEffect, useState } from 'react';
import { User, CreditCard, Users, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabase-admin';
import InviteUserModal from '../../components/modals/InviteUserModal';
import BillingModal from '../../components/billing/BillingModal';

export default function SettingsView() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const client = supabaseAdmin || supabase;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client as any)
          .from('profiles')
          .select('full_name, avatar_url, email')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setDisplayName(data?.full_name || user.user_metadata?.full_name || '');
        setAvatarUrl(data?.avatar_url || '');
        setEmail(data?.email || user.email || '');
      } catch (e) {
        console.error(e);
        setEmail(user?.email || '');
      }
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const client = supabaseAdmin || supabase;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (client as any)
        .from('profiles')
        .upsert({ id: user.id, full_name: displayName, avatar_url: avatarUrl, email })
        .eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const settingsSections = [
    {
      title: 'Profile',
      icon: User,
      description: 'Manage your personal information and preferences',
      items: ['Personal Information', 'Profile Picture', 'Password']
    },
    {
      title: 'Team Management',
      icon: Users,
      description: 'Manage team members and invite new users',
      items: ['Invite Users'],
      actions: [
        {
          label: 'Invite Team Member',
          icon: UserPlus,
          action: () => setShowInviteModal(true)
        }
      ]
    },
    {
      title: 'Billing',
      icon: CreditCard,
      description: 'Manage your subscription and payment methods',
      items: ['Subscription Plan', 'Payment Methods'],
      actions: [
        {
          label: 'Manage Billing',
          action: () => setShowBillingModal(true)
        }
      ]
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
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-16 h-16 object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {displayName || `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`.trim() || 'Account'}
              </h3>
              <p className="text-gray-600">{email || user?.email}</p>
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
                    {section.title === 'Profile' ? (
                      <div className="grid gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Display name</label>
                          <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm" placeholder="Your name" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Email</label>
                          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Avatar URL</label>
                          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full max-w-md rounded border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                        </div>
                        <div>
                          <button disabled={saving} onClick={saveProfile} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {section.actions?.map((action, actionIndex) => {
                          const Icon = (action as any).icon;
                          return (
                            <button
                              key={actionIndex}
                              onClick={action.action}
                              className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                              {action.label}
                            </button>
                          );
                        }) || <p className="text-sm text-gray-500 italic">Configuration coming soon</p>}
                      </div>
                    )}
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
            <button onClick={signOut} className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Sign Out</button>
            <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors ml-4">
              Delete Account
            </button>
          </div>
        </div>

        {/* Modals */}
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
        
        <BillingModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
        />
      </div>
    </div>
  );
}