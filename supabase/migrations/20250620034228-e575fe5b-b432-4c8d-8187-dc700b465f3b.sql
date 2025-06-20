
-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view QA inspections for their projects" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can create QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can update their QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can view checklist items for their inspections" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items for their inspections" ON public.qa_checklist_items;

-- Create simplified policies without organization_users references
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (project_manager_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (project_manager_id = auth.uid());

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (project_manager_id = auth.uid());

-- Simplified QA inspection policies
CREATE POLICY "Users can view their QA inspections" ON public.qa_inspections
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their QA inspections" ON public.qa_inspections
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their QA inspections" ON public.qa_inspections
  FOR UPDATE USING (created_by = auth.uid());

-- Simplified checklist items policies
CREATE POLICY "Users can view their checklist items" ON public.qa_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      WHERE qi.id = qa_checklist_items.inspection_id
      AND qi.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage their checklist items" ON public.qa_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.qa_inspections qi
      WHERE qi.id = qa_checklist_items.inspection_id
      AND qi.created_by = auth.uid()
    )
  );
