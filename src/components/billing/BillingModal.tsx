import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { paymentPlans } from '../../lib/stripe';
import { createCheckoutSession } from '../../lib/stripe';
import NotificationModal from '../modals/NotificationModal';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export default function BillingModal({ isOpen, onClose, currentPlan = 'free' }: BillingModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async (planKey: string) => {
    const plan = paymentPlans[planKey as keyof typeof paymentPlans];
    if (!plan || plan.price === 0) return; // Skip free plan

    try {
      setLoading(planKey);
      await createCheckoutSession(planKey); // Pass plan key instead of price ID
    } catch (error) {
      console.error('Failed to start checkout:', error);
      setShowErrorModal(true);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(paymentPlans).map(([planKey, plan]) => {
            const isCurrentPlan = currentPlan === planKey;
            const isPopular = planKey === 'pro';

            return (
              <div
                key={planKey}
                className={`relative border rounded-lg p-6 ${
                  isPopular
                    ? 'border-teal-500 ring-2 ring-teal-200'
                    : 'border-gray-200'
                } ${isCurrentPlan ? 'bg-gray-50' : 'bg-white'}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : planKey === 'free' ? (
                    <button
                      onClick={onClose}
                      className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Continue with Free
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(planKey)}
                      disabled={loading === planKey}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        isPopular
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'border border-teal-600 text-teal-600 hover:bg-teal-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === planKey ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>All plans include 14-day free trial. Cancel anytime.</p>
          <p className="mt-1">
            Need help choosing?{' '}
            <a href="#" className="text-teal-600 hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>

      {/* Error Modal */}
      <NotificationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Checkout Error"
        message="Failed to start checkout. Please try again."
        type="error"
      />
    </div>
  );
}
