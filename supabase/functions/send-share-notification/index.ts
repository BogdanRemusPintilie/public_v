import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dataset_name, owner_email, shared_with_email }: ShareNotificationRequest = await req.json();

    console.log(`Sending share notification for dataset ${dataset_name} from ${owner_email} to ${shared_with_email}`);

    const emailResponse = await resend.emails.send({
      from: "RiskBlocs <onboarding@resend.dev>",
      to: [shared_with_email],
      subject: `Dataset "${dataset_name}" has been shared with you`,
      html: `
        <h1>Dataset Shared</h1>
        <p>Hello,</p>
        <p><strong>${owner_email}</strong> has shared the dataset "<strong>${dataset_name}</strong>" with you.</p>
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