
-- Fix the infinite recursion issue in organization_users policies
DROP POLICY IF EXISTS "Users can view QA inspections in their organization" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can create QA inspections in their organization" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can update QA inspections they created" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can view checklist items for accessible inspections" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items for their inspections" ON public.qa_checklist_items;

-- Add RLS policies for projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies - allow users to see their own projects or organization projects
CREATE POLICY "Users can view their projects" ON public.projects
  FOR SELECT USING (
    project_manager_id = auth.uid() OR
    (organization_id IS NULL AND project_manager_id = auth.uid()) OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    ))
  );

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    project_manager_id = auth.uid()
  );

CREATE POLICY "Users can update their projects" ON public.projects
  FOR UPDATE USING (
    project_manager_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_users 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'project_manager')
      AND status = 'active'
    ))
  );

-- Simplified QA inspection policies without organization_users recursion
CREATE POLICY "Users can view QA inspections for their projects" ON public.qa_inspections
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = qa_inspections.project_id 
      AND p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create QA inspections" ON public.qa_inspections
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = qa_inspections.project_id 
      AND p.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their QA inspections" ON public.qa_inspections
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Simplified checklist items policies
CREATE POLICY "Users can view checklist items for their inspections" ON public.qa_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      WHERE qi.id = qa_checklist_items.inspection_id
      AND qi.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage checklist items for their inspections" ON public.qa_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      WHERE qi.id = qa_checklist_items.inspection_id
      AND qi.created_by = auth.uid()
    )
  );
