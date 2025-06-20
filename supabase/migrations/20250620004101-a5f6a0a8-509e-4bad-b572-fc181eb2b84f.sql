
-- Create QA/ITP inspections table
CREATE TABLE public.qa_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  inspection_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  task_area TEXT NOT NULL,
  location_reference TEXT NOT NULL,
  inspection_type TEXT CHECK (inspection_type IN ('post-installation', 'final', 'progress')) NOT NULL,
  template_type TEXT CHECK (template_type IN ('doors-jambs-hardware', 'skirting')) NOT NULL,
  is_fire_door BOOLEAN DEFAULT FALSE,
  inspector_name TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  digital_signature TEXT NOT NULL,
  overall_status TEXT CHECK (overall_status IN ('pass', 'fail', 'pending-reinspection')) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create QA checklist items table
CREATE TABLE public.qa_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID REFERENCES public.qa_inspections(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL, -- references the template item ID
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status TEXT CHECK (status IN ('pass', 'fail', 'na', '')) DEFAULT '',
  comments TEXT,
  evidence_files TEXT[], -- array of file paths/URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_qa_inspections_project_id ON public.qa_inspections(project_id);
CREATE INDEX idx_qa_inspections_organization_id ON public.qa_inspections(organization_id);
CREATE INDEX idx_qa_checklist_items_inspection_id ON public.qa_checklist_items(inspection_id);

-- Enable Row Level Security
ALTER TABLE public.qa_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qa_inspections
CREATE POLICY "Users can view QA inspections in their organization" ON public.qa_inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = qa_inspections.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create QA inspections in their organization" ON public.qa_inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = qa_inspections.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update QA inspections they created" ON public.qa_inspections
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = qa_inspections.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'project_manager')
      AND status = 'active'
    )
  );

-- RLS Policies for qa_checklist_items
CREATE POLICY "Users can view checklist items for accessible inspections" ON public.qa_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      JOIN public.organization_users ou ON qi.organization_id = ou.organization_id
      WHERE qi.id = qa_checklist_items.inspection_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

CREATE POLICY "Users can manage checklist items for their inspections" ON public.qa_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      JOIN public.organization_users ou ON qi.organization_id = ou.organization_id
      WHERE qi.id = qa_checklist_items.inspection_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
    )
  );

-- Generate unique inspection numbers
CREATE OR REPLACE FUNCTION public.generate_inspection_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get the current count of inspections and add 1
  SELECT COUNT(*) + 1 INTO counter FROM public.qa_inspections;
  
  -- Format as QA-YYYY-NNNN
  new_number := 'QA-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;
