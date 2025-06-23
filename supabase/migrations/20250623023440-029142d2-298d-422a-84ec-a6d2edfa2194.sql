
-- Create variations table with all the required fields
CREATE TABLE IF NOT EXISTS public.variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id),
  variation_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_impact NUMERIC DEFAULT 0,
  time_impact INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  category TEXT CHECK (category IN ('electrical', 'plumbing', 'structural', 'fixtures', 'finishes', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  client_email TEXT,
  justification TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  approved_by UUID REFERENCES auth.users(id),
  approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;

-- Create policies for variations
CREATE POLICY "Users can view variations for their projects" 
  ON public.variations 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create variations for their projects" 
  ON public.variations 
  FOR INSERT 
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variations for their projects" 
  ON public.variations 
  FOR UPDATE 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE project_manager_id = auth.uid()
    )
  );

-- Create function to generate variation numbers
CREATE OR REPLACE FUNCTION public.generate_variation_number(project_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  new_number TEXT;
BEGIN
  -- Get the current count of variations for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.variations 
  WHERE project_id = project_uuid;
  
  -- Format as VAR-NNNN
  new_number := 'VAR-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$;
