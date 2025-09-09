// @ts-nocheck
declare const Deno: {
  env: { get(name: string): string | undefined };
};

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    const { 
      to_email, 
      to_name, 
      workspace_name, 
      role, 
      inviter_name, 
      accept_url, 
      expires_in 
    } = await req.json();

    console.log('Sending invitation email to:', to_email);

    // EmailJS configuration - hardcoded for reliability
    const emailJSConfig = {
      serviceId: 'service_id8n5g1',
      templateId: 'template_gm44c2o',
      publicKey: 'TWcCfA8uDBfcQUXX3',
      privateKey: 'TpE-YjeOvq1vm0XlD6n9A'
    };

    // EmailJS API endpoint
    const emailJSEndpoint = 'https://api.emailjs.com/api/v1.0/email/send';

    const emailData = {
      service_id: emailJSConfig.serviceId,
      template_id: emailJSConfig.templateId,
      user_id: emailJSConfig.publicKey,
      accessToken: emailJSConfig.privateKey,
      template_params: {
        to_email,
        to_name,
        workspace_name,
        role,
        inviter_name,
        accept_url,
        expires_in
      }
    };

    const emailResponse = await fetch(emailJSEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('EmailJS API error:', errorText);
      
      // Return success but indicate email failed - invitation was still created
      return new Response(JSON.stringify({ 
        success: true, 
        emailSent: false, 
        message: 'Invitation created but email sending failed',
        invitationLink: accept_url,
        error: errorText 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Email sent successfully via EmailJS');

    return new Response(JSON.stringify({ 
      success: true, 
      emailSent: true, 
      message: 'Invitation email sent successfully',
      invitationLink: accept_url 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    const message = (error as Error)?.message || 'Unknown error';
    
    return new Response(JSON.stringify({ 
      success: false, 
      emailSent: false, 
      error: message,
      message: 'Failed to send invitation email'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
