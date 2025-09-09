import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe with hardcoded test key for immediate functionality
export const stripePromise = loadStripe('pk_test_51RvzrxLab3Bcpw62uUuWslAvSzIgK4TDhlGjAliLnvvNmqBhwxDu5oPfZEWQOIKXkHvgwVeK0VlMWAqm4i1xtvd600pFFttgHc');

// Define payment plans with dynamic pricing
export const paymentPlans = {
  free: {
    name: 'Free',
    price: 0,
    amount: 0,
    features: [
      'Up to 3 projects',
      'Basic Gantt charts',
      'Task management',
      'Email support'
    ]
  },
  starter: {
    name: 'Starter',
    price: 10,
    amount: 1000, // $10 in cents
    features: [
      'Up to 5 projects',
      'Basic Gantt charts',
      'Team collaboration',
      'Email support',
      '5GB storage'
    ]
  },
  pro: {
    name: 'Pro',
    price: 29,
    amount: 2900, // $29 in cents
    features: [
      'Unlimited projects',
      'Advanced Gantt charts',
      'Team collaboration',
      'Priority support',
      '100GB storage',
      'Custom fields',
      'Time tracking'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    amount: 9900, // $99 in cents
    features: [
      'Everything in Pro',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage',
      'SSO authentication',
      'Custom branding'
    ]
  }
};

// Create checkout session using Supabase Edge Function
export async function createCheckoutSession(planKey: string, workspaceId?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        plan: planKey,
        workspaceId: workspaceId || 'default'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url;
    
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

// Create portal session function - simplified for demo
export const createPortalSession = async () => {
  try {
    // For now, just redirect to Stripe's customer portal
    // In production, you'd need a backend endpoint
    window.open('https://billing.stripe.com/p/login/test_aEUaEU', '_blank');
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};
