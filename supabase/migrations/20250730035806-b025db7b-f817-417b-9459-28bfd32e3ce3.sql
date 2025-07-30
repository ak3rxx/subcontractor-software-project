-- Create tables for document learning and workflow automation

-- Document parsing feedback table
CREATE TABLE IF NOT EXISTS public.document_parsing_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  is_correct BOOLEAN NOT NULL,
  corrections JSONB,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document learning patterns table
CREATE TABLE IF NOT EXISTS public.document_learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  document_id UUID,
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  correction_type TEXT NOT NULL, -- milestone, trade, zone
  pattern_hint TEXT,
  document_type TEXT,
  success_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 1,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow automation rules table
CREATE TABLE IF NOT EXISTS public.workflow_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  organization_id UUID,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL, -- milestone_completed, qa_passed, variation_approved, task_completed
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow automation logs table
CREATE TABLE IF NOT EXISTS public.workflow_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  rule_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  execution_result JSONB
);

-- Enable Row Level Security
ALTER TABLE public.document_parsing_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_parsing_feedback
CREATE POLICY "Users can view feedback from their organization" 
ON public.document_parsing_feedback 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own feedback" 
ON public.document_parsing_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for document_learning_patterns
CREATE POLICY "Users can view learning patterns from their organization" 
ON public.document_learning_patterns 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage learning patterns" 
ON public.document_learning_patterns 
FOR ALL 
USING (true);

-- RLS Policies for workflow_automation_rules
CREATE POLICY "Users can view automation rules for their projects" 
ON public.workflow_automation_rules 
FOR SELECT 
USING (
  project_id IN (
    SELECT project_id FROM public.project_team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Project managers can manage automation rules" 
ON public.workflow_automation_rules 
FOR ALL 
USING (
  project_id IN (
    SELECT project_id FROM public.project_team_members 
    WHERE user_id = auth.uid() AND role IN ('project_manager', 'admin')
  )
);

-- RLS Policies for workflow_automation_logs
CREATE POLICY "Users can view automation logs for their projects" 
ON public.workflow_automation_logs 
FOR SELECT 
USING (
  project_id IN (
    SELECT project_id FROM public.project_team_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can create automation logs" 
ON public.workflow_automation_logs 
FOR INSERT 
WITH CHECK (true);

-- Add foreign key constraints
ALTER TABLE public.document_parsing_feedback 
ADD CONSTRAINT fk_document_parsing_feedback_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;

ALTER TABLE public.document_learning_patterns 
ADD CONSTRAINT fk_document_learning_patterns_document 
FOREIGN KEY (document_id) REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_automation_rules 
ADD CONSTRAINT fk_workflow_automation_rules_project 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_automation_logs 
ADD CONSTRAINT fk_workflow_automation_logs_project 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.workflow_automation_logs 
ADD CONSTRAINT fk_workflow_automation_logs_rule 
FOREIGN KEY (rule_id) REFERENCES public.workflow_automation_rules(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_feedback_document_id ON public.document_parsing_feedback(document_id);
CREATE INDEX IF NOT EXISTS idx_document_feedback_user_id ON public.document_parsing_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_organization ON public.document_learning_patterns(organization_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_correction_type ON public.document_learning_patterns(correction_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_project ON public.workflow_automation_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON public.workflow_automation_rules(trigger);
CREATE INDEX IF NOT EXISTS idx_automation_logs_project ON public.workflow_automation_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_executed_at ON public.workflow_automation_logs(executed_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_document_feedback_updated_at
BEFORE UPDATE ON public.document_parsing_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.workflow_automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();