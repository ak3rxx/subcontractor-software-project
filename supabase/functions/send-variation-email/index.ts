
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VariationEmailRequest {
  variation: {
    variation_number: string;
    title: string;
    description?: string;
    location?: string;
    cost_impact: number;
    time_impact: number;
    priority: string;
    category?: string;
    status: string;
    submitted_date: string;
    justification?: string;
  };
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { variation, recipientEmail }: VariationEmailRequest = await req.json();

    const formatCurrency = (amount: number) => {
      if (amount >= 0) {
        return `+$${amount.toLocaleString()}`;
      }
      return `-$${Math.abs(amount).toLocaleString()}`;
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .variation-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 10px; }
          .cost-impact { font-size: 18px; font-weight: bold; color: ${variation.cost_impact >= 0 ? '#16a34a' : '#dc2626'}; }
          .priority-high { color: #dc2626; font-weight: bold; }
          .priority-normal { color: #2563eb; }
          .priority-low { color: #16a34a; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">DC Squared Construction</div>
          <div>Project Variation Notice</div>
        </div>
        
        <div class="variation-title">Variation ${variation.variation_number}: ${variation.title}</div>
        
        <div class="field">
          <span class="label">Date Submitted:</span>
          <span class="value">${new Date(variation.submitted_date).toLocaleDateString()}</span>
        </div>
        
        ${variation.location ? `
        <div class="field">
          <span class="label">Location:</span>
          <span class="value">${variation.location}</span>
        </div>
        ` : ''}
        
        <div class="field">
          <span class="label">Description:</span>
          <div class="value" style="margin-top: 5px;">${variation.description || 'No description provided'}</div>
        </div>
        
        <div class="field">
          <span class="label">Cost Impact:</span>
          <span class="value cost-impact">${formatCurrency(variation.cost_impact)}</span>
        </div>
        
        ${variation.time_impact ? `
        <div class="field">
          <span class="label">Time Impact:</span>
          <span class="value">${variation.time_impact > 0 ? `+${variation.time_impact}` : variation.time_impact} days</span>
        </div>
        ` : ''}
        
        <div class="field">
          <span class="label">Priority:</span>
          <span class="value priority-${variation.priority}">${variation.priority.charAt(0).toUpperCase() + variation.priority.slice(1)}</span>
        </div>
        
        ${variation.category ? `
        <div class="field">
          <span class="label">Category:</span>
          <span class="value">${variation.category.charAt(0).toUpperCase() + variation.category.slice(1)}</span>
        </div>
        ` : ''}
        
        <div class="field">
          <span class="label">Status:</span>
          <span class="value">${variation.status.charAt(0).toUpperCase() + variation.status.slice(1)}</span>
        </div>
        
        ${variation.justification ? `
        <div class="field">
          <span class="label">Justification:</span>
          <div class="value" style="margin-top: 5px;">${variation.justification}</div>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>This variation notice was generated automatically by DC Squared Construction's project management system.</p>
          <p>Please review the variation details and contact us if you have any questions or concerns.</p>
          <p>DC Squared Construction | 123 Builder Street, Brisbane QLD 4000 | +61 7 1234 5678</p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "DC Squared Construction <variations@dcsquared.com.au>",
      to: [recipientEmail],
      subject: `Project Variation ${variation.variation_number}: ${variation.title}`,
      html: emailHtml,
    });

    console.log("Variation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-variation-email function:", error);
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
