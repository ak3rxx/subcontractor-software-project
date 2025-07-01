
-- Create payment_claims table to store incoming payment claims
CREATE TABLE public.payment_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id),
  claimant_company_name TEXT NOT NULL,
  claimant_abn TEXT NOT NULL,
  claimant_acn TEXT,
  claimant_address TEXT NOT NULL,
  claimant_suburb TEXT NOT NULL,
  claimant_postcode TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claim_number TEXT NOT NULL,
  claim_amount NUMERIC NOT NULL DEFAULT 0,
  claim_received_date DATE NOT NULL,
  contract_number TEXT,
  claim_description TEXT,
  supporting_documents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'received',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment_schedules table to store respondent schedules
CREATE TABLE public.payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_claim_id UUID REFERENCES public.payment_claims(id),
  project_id UUID REFERENCES public.projects(id),
  schedule_number TEXT NOT NULL,
  respondent_company_name TEXT NOT NULL,
  respondent_abn TEXT NOT NULL,
  respondent_acn TEXT,
  respondent_address TEXT NOT NULL,
  respondent_suburb TEXT NOT NULL,
  respondent_postcode TEXT NOT NULL,
  respondent_email TEXT NOT NULL,
  scheduled_amount NUMERIC NOT NULL DEFAULT 0,
  withheld_amount NUMERIC NOT NULL DEFAULT 0,
  withholding_reasons JSONB DEFAULT '[]'::jsonb,
  contract_clauses TEXT,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  service_method TEXT NOT NULL DEFAULT 'email',
  service_proof TEXT,
  service_date DATE,
  pdf_path TEXT,
  word_path TEXT,
  legal_deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment_schedule_audit_trail table for legal compliance tracking
CREATE TABLE public.payment_schedule_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_schedule_id UUID REFERENCES public.payment_schedules(id),
  payment_claim_id UUID REFERENCES public.payment_claims(id),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  action_description TEXT,
  deadline_status TEXT,
  days_remaining INTEGER,
  risk_level TEXT DEFAULT 'low',
  metadata JSONB DEFAULT '{}'::jsonb,
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to calculate business days (excluding weekends)
CREATE OR REPLACE FUNCTION public.calculate_business_days(start_date DATE, days_to_add INTEGER)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  result_date DATE := start_date;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < days_to_add LOOP
    result_date := result_date + INTERVAL '1 day';
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM result_date) NOT IN (0, 6) THEN
      days_added := days_added + 1;
    END IF;
  END LOOP;
  
  RETURN result_date;
END;
$$;

-- Create function to generate payment schedule number
CREATE OR REPLACE FUNCTION public.generate_payment_schedule_number(project_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  proj_number INTEGER;
  new_number TEXT;
BEGIN
  -- Get project number
  SELECT project_number INTO proj_number
  FROM public.projects 
  WHERE id = project_uuid;
  
  -- Fallback if no project found
  IF proj_number IS NULL THEN
    proj_number := 1;
  END IF;
  
  -- Get the current count of payment schedules for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.payment_schedules 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-PS-NNNN (e.g., 001-PS-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-PS-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Create function to get withholding suggestions based on project data
CREATE OR REPLACE FUNCTION public.get_withholding_suggestions(project_uuid UUID)
RETURNS TABLE(
  reason TEXT,
  suggestion_type TEXT,
  evidence_count INTEGER,
  confidence_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Variation not approved' as reason,
    'variation' as suggestion_type,
    COUNT(*)::INTEGER as evidence_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 0.9
      ELSE 0.0
    END as confidence_score
  FROM public.variations v
  WHERE v.project_id = project_uuid 
    AND v.status IN ('draft', 'pending_approval')
    AND v.created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Defective Works' as reason,
    'qa_failure' as suggestion_type,
    COUNT(*)::INTEGER as evidence_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 0.8
      ELSE 0.0
    END as confidence_score
  FROM public.qa_inspections qi
  WHERE qi.project_id = project_uuid 
    AND qi.overall_status = 'failed'
    AND qi.created_at >= NOW() - INTERVAL '30 days'
  
  UNION ALL
  
  SELECT 
    'Supporting Documents not provided' as reason,
    'document_missing' as suggestion_type,
    COUNT(*)::INTEGER as evidence_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 0.7
      ELSE 0.0
    END as confidence_score
  FROM public.rfis r
  WHERE r.project_id = project_uuid 
    AND r.status = 'open'
    AND r.created_at >= NOW() - INTERVAL '30 days';
END;
$$;

-- Create trigger function to auto-calculate legal deadline
CREATE OR REPLACE FUNCTION public.set_payment_schedule_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  claim_date DATE;
BEGIN
  -- Get the claim received date
  SELECT claim_received_date INTO claim_date
  FROM public.payment_claims
  WHERE id = NEW.payment_claim_id;
  
  -- Set legal deadline to 10 business days from claim received date
  NEW.legal_deadline := public.calculate_business_days(claim_date, 10);
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set legal deadline
CREATE TRIGGER set_payment_schedule_deadline_trigger
  BEFORE INSERT ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_schedule_deadline();

-- Create trigger function to log audit trail
CREATE OR REPLACE FUNCTION public.log_payment_schedule_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  days_remaining INTEGER;
  risk_level TEXT;
BEGIN
  -- Calculate days remaining
  days_remaining := NEW.legal_deadline - CURRENT_DATE;
  
  -- Determine risk level
  IF days_remaining <= 1 THEN
    risk_level := 'critical';
  ELSIF days_remaining <= 3 THEN
    risk_level := 'high';
  ELSIF days_remaining <= 5 THEN
    risk_level := 'medium';
  ELSE
    risk_level := 'low';
  END IF;
  
  -- Log the audit entry
  INSERT INTO public.payment_schedule_audit_trail (
    payment_schedule_id,
    payment_claim_id,
    user_id,
    action_type,
    action_description,
    deadline_status,
    days_remaining,
    risk_level,
    metadata
  ) VALUES (
    NEW.id,
    NEW.payment_claim_id,
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'status_change'
      ELSE 'update'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Payment schedule created'
      WHEN TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Payment schedule updated'
    END,
    CASE 
      WHEN days_remaining < 0 THEN 'overdue'
      WHEN days_remaining <= 1 THEN 'urgent'
      WHEN days_remaining <= 3 THEN 'due_soon'
      ELSE 'on_track'
    END,
    days_remaining,
    risk_level,
    jsonb_build_object(
      'scheduled_amount', NEW.scheduled_amount,
      'withheld_amount', NEW.withheld_amount,
      'service_method', NEW.service_method
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to log audit trail
CREATE TRIGGER log_payment_schedule_audit_trigger
  AFTER INSERT OR UPDATE ON public.payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_schedule_audit();

-- Enable RLS on all tables
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedule_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_claims
CREATE POLICY "Users can view payment claims for their projects" 
  ON public.payment_claims 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment claims for their projects" 
  ON public.payment_claims 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payment claims for their projects" 
  ON public.payment_claims 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

-- Create RLS policies for payment_schedules
CREATE POLICY "Users can view payment schedules for their projects" 
  ON public.payment_schedules 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payment schedules for their projects" 
  ON public.payment_schedules 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payment schedules for their projects" 
  ON public.payment_schedules 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.project_manager_id = auth.uid()
    )
  );

-- Create RLS policies for payment_schedule_audit_trail
CREATE POLICY "Users can view payment schedule audit trail for their projects" 
  ON public.payment_schedule_audit_trail 
  FOR SELECT 
  USING (
    payment_schedule_id IN (
      SELECT ps.id FROM public.payment_schedules ps
      JOIN public.projects p ON ps.project_id = p.id
      WHERE p.project_manager_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_payment_claims_project_id ON public.payment_claims(project_id);
CREATE INDEX idx_payment_claims_status ON public.payment_claims(status);
CREATE INDEX idx_payment_claims_received_date ON public.payment_claims(claim_received_date);

CREATE INDEX idx_payment_schedules_project_id ON public.payment_schedules(project_id);
CREATE INDEX idx_payment_schedules_claim_id ON public.payment_schedules(payment_claim_id);
CREATE INDEX idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX idx_payment_schedules_deadline ON public.payment_schedules(legal_deadline);

CREATE INDEX idx_payment_audit_schedule_id ON public.payment_schedule_audit_trail(payment_schedule_id);
CREATE INDEX idx_payment_audit_timestamp ON public.payment_schedule_audit_trail(action_timestamp);
CREATE INDEX idx_payment_audit_risk_level ON public.payment_schedule_audit_trail(risk_level);
