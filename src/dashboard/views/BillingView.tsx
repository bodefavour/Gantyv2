import { useState } from 'react';
import { stripePromise, paymentPlans } from '../../lib/stripe';
import { Check, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

export default function BillingView() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, priceId: string) => {
    if (!user || !currentWorkspace) return;

    setLoading(planId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Create checkout session (you'd implement this API endpoint)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId: user.id,
          workspaceId: currentWorkspace.id,
          successUrl: `${window.location.origin}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard/settings`,
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Error redirecting to Stripe:', error);
        alert('Failed to start checkout process');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">Free Plan</p>
              <p className="text-gray-600">You're currently on the free plan</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">$0</p>
              <p className="text-gray-600">per month</p>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(paymentPlans).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-white rounded-lg border p-6 ${
                key === 'pro' ? 'border-teal-500 ring-2 ring-teal-500' : 'border-gray-200'
              }`}
            >
              {key === 'pro' && (
                <div className="bg-teal-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-600">/month</span>}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.priceId && handleSubscribe(key, plan.priceId)}
                disabled={loading === key || key === 'free'}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  key === 'free'
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : key === 'pro'
                    ? 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
                    : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                }`}
              >
                {loading === key ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : key === 'free' ? (
                  'Current Plan'
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
          </div>
          <p className="text-gray-600 mb-4">No payment methods on file</p>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Add Payment Method
          </button>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <p className="text-gray-600">No billing history available</p>
        </div>
      </div>
    </div>
  );
}
