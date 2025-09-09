// @ts-nocheck
// Ambient declaration so local tooling recognizes the Deno global when type-checking.
declare const Deno: {
  env: { get(name: string): string | undefined };
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { plan, workspaceId } = await req.json();
    console.log('Creating checkout session:', { plan, workspaceId, user: user.id });

    // Get Stripe key from environment
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || 'sk_test_51RvzrxLab3Bcpw62dC5KqGxvHZ9qUOGwHoHJPM0s5TzLFxNM2UOJ3P2hJBGl3E8HSZhF4cJoWdpKwfRqJLHPLbf000y89dDGfh';
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Define pricing
    const planPricing = {
      starter: { amount: 1000, name: 'Starter Plan' }, // $10/month
      pro: { amount: 2900, name: 'Pro Plan' }, // $29/month
      enterprise: { amount: 9900, name: 'Enterprise Plan' }, // $99/month
    } as const;

    const selectedPlan = planPricing[plan as keyof typeof planPricing];
    if (!selectedPlan) {
      return new Response(JSON.stringify({ error: 'Invalid plan selected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Determine redirect origin
    const origin = req.headers.get('origin') || Deno.env.get('SITE_URL') || 'http://localhost:5173';

    // Create checkout session with dynamic pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { 
              name: selectedPlan.name,
              description: `${selectedPlan.name} - Monthly subscription for Ganty project management`,
            },
            unit_amount: selectedPlan.amount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?subscription=success&plan=${plan}`,
      cancel_url: `${origin}/dashboard?subscription=cancelled`,
      metadata: {
        workspace_id: workspaceId,
        plan: plan,
        user_id: user.id,
      },
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.id);
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    const message = (error as Error)?.message || 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
