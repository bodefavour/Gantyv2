import React, { useMemo, useState, useEffect } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { differenceInCalendarDays, format } from 'date-fns';

interface TrialGateProps {
  children: React.ReactNode;
}

export default function TrialGate({ children }: TrialGateProps) {
  const { currentWorkspace } = useWorkspace();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('trial_banner_dismissed');
      if (v === 'true') setDismissed(true);
    } catch {}
  }, []);

  const dismissBanner = () => {
    setDismissed(true);
    try { localStorage.setItem('trial_banner_dismissed', 'true'); } catch {}
  };

  const trial = useMemo(() => {
    if (!currentWorkspace?.trial_ends_at) return null;
    const ends = new Date(currentWorkspace.trial_ends_at);
    const daysLeft = differenceInCalendarDays(ends, new Date());
    return { ends, daysLeft };
  }, [currentWorkspace?.trial_ends_at]);

  const isActiveSub = currentWorkspace?.subscription_status === 'active';
  const isTrialExpired = trial && trial.daysLeft < 0 && !isActiveSub;

  if (isTrialExpired) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your trial has ended</h2>
            <p className="text-gray-600 mb-6">Upgrade now to continue using the dashboard features for your workspace.</p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade workspace
            </button>
        </div>
        {showUpgrade && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
              <button onClick={() => setShowUpgrade(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">×</button>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade plan</h3>
              <p className="text-sm text-gray-600 mb-4">Billing integration placeholder. Implement checkout with your payment provider here.</p>
              <div className="space-y-3 mb-6">
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pro Plan</div>
                    <div className="text-xs text-gray-600">Unlimited projects • Dependencies • Reporting</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">$19/mo</div>
                </div>
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Business</div>
                    <div className="text-xs text-gray-600">Portfolios • Advanced workload • SSO</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">$49/mo</div>
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Proceed to checkout (stub)</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {trial && !isActiveSub && trial.daysLeft >= 0 && !dismissed && (
        <div className="bg-indigo-600 text-white text-sm px-4 py-2 flex items-center justify-between relative">
          <span className="pr-8">
            Trial: {trial.daysLeft === 0 ? 'Last day!' : `${trial.daysLeft} day${trial.daysLeft === 1 ? '' : 's'} left`} • Ends {format(trial.ends, 'MMM d, yyyy')}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpgrade(true)} className="bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-xs font-medium transition-colors">Upgrade</button>
            <button onClick={dismissBanner} className="text-white/70 hover:text-white text-lg leading-none px-2">×</button>
          </div>
        </div>
      )}
      {children}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button onClick={() => setShowUpgrade(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">×</button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade plan</h3>
            <p className="text-sm text-gray-600 mb-4">Billing integration placeholder. Implement checkout with your payment provider here.</p>
            <div className="space-y-3 mb-6">
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Pro Plan</div>
                  <div className="text-xs text-gray-600">Unlimited projects • Dependencies • Reporting</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">$19/mo</div>
              </div>
              <div className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Business</div>
                  <div className="text-xs text-gray-600">Portfolios • Advanced workload • SSO</div>
                </div>
                <div className="text-sm font-semibold text-gray-900">$49/mo</div>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700">Proceed to checkout (stub)</button>
          </div>
        </div>
      )}
    </>
  );
}
