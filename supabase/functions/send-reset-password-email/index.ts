import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordEmailRequest {
  email: string;
  userName?: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      userName,
      resetUrl 
    }: ResetPasswordEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Grandscale <noreply@grandscale.au>",
      to: [email],
      subject: "Reset your Grandscale password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Grandscale</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; background: #2563eb !important; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; border: none; }
            .warning-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0; }
            .footer { padding: 20px 30px; background: #f8fafc; color: #6b7280; font-size: 14px; text-align: center; }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Grandscale Project Management</p>
              </div>
              
              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
                
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                
                <p>We received a request to reset the password for your Grandscale account associated with <strong>${email}</strong>.</p>
                
                <div class="warning-box">
                  <p style="margin: 0; color: #92400e; font-weight: 500;">⚠️ Security Notice</p>
                  <p style="margin: 8px 0 0 0; color: #92400e;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                
                <p>To reset your password, click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: #2563eb !important; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 6px; font-weight: 500; margin: 20px 0; border: none; font-family: inherit;">Reset Password</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="font-size: 14px; color: #6b7280;">
                  This password reset link will expire in 1 hour for security reasons. If you need assistance, please contact your organization administrator.
                </p>
                
                <p style="font-size: 14px; color: #6b7280;">
                  For security tips and best practices, visit our help center.
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 0;">
                  © 2024 Grandscale. Professional construction project management.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 12px;">
                  This email was sent to ${email}. This is an automated message, please do not reply.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

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
    console.error("Error in send-reset-password function:", error);
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