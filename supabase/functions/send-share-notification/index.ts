import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShareNotificationRequest {
  dataset_name: string;
  owner_email: string;
  shared_with_email: string;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { dataset_name, owner_email, shared_with_email }: ShareNotificationRequest = await req.json();

    // Validate inputs
    if (!dataset_name || !owner_email || !shared_with_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate email format
    if (!emailRegex.test(shared_with_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify owner_email matches authenticated user
    if (owner_email !== user.email) {
      console.error('Email mismatch:', { owner_email, user_email: user.email });
      return new Response(
        JSON.stringify({ error: 'Email mismatch' }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify dataset share exists and user owns it
    const { data: share, error: shareError } = await supabaseClient
      .from('dataset_shares')
      .select('*')
      .eq('owner_id', user.id)
      .eq('dataset_name', dataset_name)
      .eq('shared_with_email', shared_with_email)
      .single();

    if (shareError || !share) {
      console.error('Share verification failed:', shareError);
      return new Response(
        JSON.stringify({ error: 'Invalid or unauthorized share' }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Sending share notification for dataset ${dataset_name} from ${owner_email} to ${shared_with_email}`);

    // Sanitize inputs for HTML (prevent HTML injection)
    const sanitize = (str: string) => str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    const emailResponse = await resend.emails.send({
      from: "RiskBlocs <onboarding@resend.dev>",
      to: [shared_with_email],
      subject: `Dataset "${sanitize(dataset_name)}" has been shared with you`,
      html: `
        <h1>Dataset Shared</h1>
        <p>Hello,</p>
        <p><strong>${sanitize(owner_email)}</strong> has shared the dataset "<strong>${sanitize(dataset_name)}</strong>" with you.</p>
        <p>You can now access this dataset in your RiskBlocs dashboard.</p>
        <p>Best regards,<br>The RiskBlocs Team</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-share-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);