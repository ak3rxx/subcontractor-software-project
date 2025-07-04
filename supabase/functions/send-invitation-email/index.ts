import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  organizationName: string;
  role: string;
  invitedByName: string;
  invitationToken: string;
  baseUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      organizationName, 
      role, 
      invitedByName, 
      invitationToken,
      baseUrl 
    }: InvitationEmailRequest = await req.json();

    const invitationUrl = `${baseUrl}/invitation?token=${invitationToken}`;
    
    const roleDisplayName = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    const emailResponse = await resend.emails.send({
      from: "Grandscale <noreply@grandscale.app>",
      to: [email],
      subject: `You're invited to join ${organizationName} on Grandscale`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Join ${organizationName} on Grandscale</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
            .role-badge { background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; }
            .footer { padding: 20px 30px; background: #f8fafc; color: #6b7280; font-size: 14px; text-align: center; }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to Grandscale</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Construction Project Management Platform</p>
              </div>
              
              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>
                
                <p><strong>${invitedByName}</strong> has invited you to join <strong>${organizationName}</strong> on Grandscale as a <span class="role-badge">${roleDisplayName}</span>.</p>
                
                <p>Grandscale is a comprehensive construction project management platform that helps teams:</p>
                <ul style="color: #4b5563;">
                  <li>Manage variations and RFIs efficiently</li>
                  <li>Track QA inspections and compliance</li>
                  <li>Monitor project budgets and costs</li>
                  <li>Streamline subcontractor onboarding</li>
                  <li>Maintain document compliance</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${invitationUrl}" style="color: #2563eb; word-break: break-all;">${invitationUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                  This invitation will expire in 3 days. If you have any questions, please contact ${invitedByName} or your organization administrator.
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">
                  © 2024 Grandscale. Professional construction project management.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);