import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingRequest {
  userRole: string;
  currentModule: string;
  userContext: {
    completedSteps?: string[];
    currentStep?: string;
    organizationName?: string;
  };
  question?: string;
  action: 'contextual_help' | 'next_steps' | 'explain_feature' | 'suggest_workflow';
}

const getRoleSpecificPrompts = (role: string) => {
  const prompts = {
    project_manager: `You are an AI assistant helping a Project Manager learn the Grandscale construction management platform. Focus on project oversight, team coordination, budget management, and milestone tracking. Provide practical guidance for managing construction projects efficiently.`,
    
    estimator: `You are an AI assistant helping an Estimator learn the Grandscale platform. Focus on cost estimation, budget planning, variation impact analysis, and financial forecasting. Provide guidance on accurate cost tracking and budget management.`,
    
    admin: `You are an AI assistant helping an Admin/Project Engineer learn Grandscale. Focus on compliance management, document organization, RFI handling, and system administration. Provide guidance on maintaining project documentation and compliance.`,
    
    site_supervisor: `You are an AI assistant helping a Site Supervisor learn Grandscale. Focus on QA inspections, material delivery tracking, task management, and on-site compliance. Provide mobile-friendly guidance for field operations.`,
    
    subcontractor: `You are an AI assistant helping a Subcontractor learn Grandscale. Focus on task completion, QA submissions, photo uploads, and progress reporting. Provide guidance on fulfilling project requirements and communication.`,
    
    org_admin: `You are an AI assistant helping an Organization Administrator learn Grandscale. Focus on team management, system setup, compliance oversight, and organization-wide configuration. Provide guidance on managing the organization effectively.`
  };
  
  return prompts[role as keyof typeof prompts] || prompts.project_manager;
};

const getModuleContext = (module: string) => {
  const contexts = {
    projects: "The Projects module allows users to create, manage, and track construction projects. Key features include project setup, team assignment, document management, and progress tracking.",
    
    variations: "The Variations module handles change requests and cost variations. Users can submit, track, approve, and manage cost and time impacts of project changes.",
    
    qa_itp: "The QA/ITP module manages quality assurance inspections and testing protocols. Users can create checklists, upload photos, record results, and track compliance.",
    
    finance: "The Finance module tracks project budgets, actual costs, forecasting, and financial reporting. Users can create budgets, track expenses, and analyze cost performance.",
    
    programme: "The Programme module manages project timelines, milestones, and scheduling. Users can create Gantt charts, track dependencies, and monitor progress.",
    
    tasks: "The Tasks module handles task assignment, tracking, and completion. Users can create, assign, and monitor project tasks across teams.",
    
    rfis: "The RFI module manages Requests for Information. Users can submit queries, track responses, and manage project clarifications.",
    
    documents: "The Documents module organizes project documentation. Users can upload, categorize, and manage project files and compliance documents."
  };
  
  return contexts[module as keyof typeof contexts] || "General platform functionality";
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userRole, currentModule, userContext, question, action }: OnboardingRequest = await req.json();

    const rolePrompt = getRoleSpecificPrompts(userRole);
    const moduleContext = getModuleContext(currentModule);
    
    let systemPrompt = `${rolePrompt}

Current Module Context: ${moduleContext}

User Progress:
- Organization: ${userContext.organizationName || 'New Organization'}
- Completed Steps: ${userContext.completedSteps?.join(', ') || 'None'}
- Current Step: ${userContext.currentStep || 'Getting Started'}

Guidelines:
- Keep responses concise and actionable (2-3 sentences max)
- Focus on practical next steps
- Use construction industry terminology appropriately
- Be encouraging and supportive
- Provide specific feature guidance when relevant
`;

    let userPrompt = '';
    
    switch (action) {
      case 'contextual_help':
        userPrompt = `I need help understanding the ${currentModule} module. ${question || 'What should I focus on first?'}`;
        break;
        
      case 'next_steps':
        userPrompt = `Based on my current progress, what should I do next in the ${currentModule} module?`;
        break;
        
      case 'explain_feature':
        userPrompt = `Can you explain this feature: ${question}? How does it help in my role as ${userRole}?`;
        break;
        
      case 'suggest_workflow':
        userPrompt = `What's the recommended workflow for ${question || currentModule} in my role as ${userRole}?`;
        break;
        
      default:
        userPrompt = question || `How can I get started with the ${currentModule} module?`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate suggested actions based on role and module
    const suggestedActions = generateSuggestedActions(userRole, currentModule, userContext);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      suggestedActions,
      context: {
        module: currentModule,
        role: userRole,
        nextSteps: suggestedActions.slice(0, 2)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-onboarding-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSuggestedActions(role: string, module: string, context: any): string[] {
  const actionMap: Record<string, Record<string, string[]>> = {
    project_manager: {
      projects: ["Create your first project", "Set up project team", "Define project milestones"],
      variations: ["Review pending variations", "Set up approval workflow", "Track variation costs"],
      finance: ["Create project budget", "Set up cost tracking", "Review budget vs actual"],
      tasks: ["Assign team tasks", "Review task progress", "Set task priorities"]
    },
    estimator: {
      finance: ["Create detailed budget", "Set up cost categories", "Import historical costs"],
      variations: ["Estimate variation costs", "Review cost impacts", "Update budget forecasts"],
      projects: ["Set up project costing", "Define budget structure", "Link to estimating data"]
    },
    site_supervisor: {
      qa_itp: ["Start quality inspection", "Upload site photos", "Complete checklists"],
      tasks: ["Check daily tasks", "Update task progress", "Report issues"],
      documents: ["Upload compliance docs", "Review safety requirements", "Submit reports"]
    }
  };

  const roleActions = actionMap[role as keyof typeof actionMap] || {};
  const moduleActions = roleActions[module as keyof typeof roleActions] || [];
  
  return moduleActions.length > 0 ? moduleActions : [
    "Explore the module features",
    "Review help documentation",
    "Contact support for assistance"
  ];
}