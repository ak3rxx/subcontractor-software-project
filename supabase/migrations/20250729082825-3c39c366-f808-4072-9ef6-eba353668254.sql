-- Create programme document storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('programme-documents', 'programme-documents', true);

-- Create storage policies for programme documents
CREATE POLICY "Users can upload programme documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'programme-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view programme documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'programme-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their programme documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'programme-documents' AND auth.uid() = owner);

CREATE POLICY "Users can delete their programme documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'programme-documents' AND auth.uid() = owner);

-- Create programme document parsing table
CREATE TABLE public.programme_document_parsing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsed_data JSONB DEFAULT '{}',
  ai_confidence NUMERIC DEFAULT 0,
  error_message TEXT,
  uploaded_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on programme document parsing
ALTER TABLE public.programme_document_parsing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for programme document parsing
CREATE POLICY "Users can create document parsing records for their projects" 
ON public.programme_document_parsing 
FOR INSERT 
WITH CHECK (project_id IN (
  SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
) AND uploaded_by = auth.uid());

CREATE POLICY "Users can view document parsing records for their projects" 
ON public.programme_document_parsing 
FOR SELECT 
USING (project_id IN (
  SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
) OR uploaded_by = auth.uid());

CREATE POLICY "Users can update document parsing records for their projects" 
ON public.programme_document_parsing 
FOR UPDATE 
USING (project_id IN (
  SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
) OR uploaded_by = auth.uid());

-- Create AI suggestions table for trade mapping and sequences
CREATE TABLE public.programme_ai_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  document_parsing_id UUID REFERENCES public.programme_document_parsing(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('trade_mapping', 'sequence_suggestion', 'milestone_creation', 'dependency_suggestion')),
  suggestion_data JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC DEFAULT 0,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on AI suggestions
ALTER TABLE public.programme_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AI suggestions
CREATE POLICY "Users can manage AI suggestions for their projects" 
ON public.programme_ai_suggestions 
FOR ALL 
USING (project_id IN (
  SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
) OR created_by = auth.uid());

-- Create trade sequences table for pattern learning
CREATE TABLE public.programme_trade_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  trade_pattern TEXT NOT NULL,
  sequence_data JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER DEFAULT 1,
  confidence_score NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trade sequences
ALTER TABLE public.programme_trade_sequences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trade sequences
CREATE POLICY "Users can view trade sequences for their organization" 
ON public.programme_trade_sequences 
FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM public.organization_users 
  WHERE user_id = auth.uid() AND status = 'active'
));

CREATE POLICY "Org admins can manage trade sequences" 
ON public.programme_trade_sequences 
FOR ALL 
USING (organization_id IN (
  SELECT organization_id FROM public.organization_users 
  WHERE user_id = auth.uid() AND role = 'org_admin' AND status = 'active'
));

-- Create function to update trade sequence usage
CREATE OR REPLACE FUNCTION public.update_trade_sequence_usage(
  p_organization_id UUID,
  p_trade_pattern TEXT,
  p_sequence_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  sequence_id UUID;
BEGIN
  INSERT INTO public.programme_trade_sequences (
    organization_id, trade_pattern, sequence_data, usage_count
  ) VALUES (
    p_organization_id, p_trade_pattern, p_sequence_data, 1
  )
  ON CONFLICT (organization_id, trade_pattern)
  DO UPDATE SET 
    usage_count = programme_trade_sequences.usage_count + 1,
    updated_at = NOW()
  RETURNING id INTO sequence_id;
  
  RETURN sequence_id;
END;
$$;