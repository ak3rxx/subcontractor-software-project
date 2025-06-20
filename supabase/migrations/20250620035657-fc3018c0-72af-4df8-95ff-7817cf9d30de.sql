
-- Fix the policy creation by dropping ALL existing policies first
-- Drop ALL existing policies on projects table
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Full access user can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Full access user can update all projects" ON public.projects;
DROP POLICY IF EXISTS "Full access user can insert all projects" ON public.projects;
DROP POLICY IF EXISTS "Full access user can delete all projects" ON public.projects;

-- Drop ALL existing policies on qa_inspections table
DROP POLICY IF EXISTS "Users can view their QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can create their QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can update their QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can view QA inspections for their projects" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can create QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Users can update their QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Full access user can view all QA inspections" ON public.qa_inspections;
DROP POLICY IF EXISTS "Full access user can manage all QA inspections" ON public.qa_inspections;

-- Drop ALL existing policies on qa_checklist_items table
DROP POLICY IF EXISTS "Users can view their checklist items" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage their checklist items" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Users can view checklist items for their inspections" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Users can manage checklist items for their inspections" ON public.qa_checklist_items;
DROP POLICY IF EXISTS "Full access user can manage all checklist items" ON public.qa_checklist_items;

-- Now create the new simplified policies
-- Projects policies - simple ownership-based
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (project_manager_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (project_manager_id = auth.uid());

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (project_manager_id = auth.uid());

-- QA inspections policies - simple ownership-based
CREATE POLICY "Users can view their QA inspections" ON public.qa_inspections
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their QA inspections" ON public.qa_inspections
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their QA inspections" ON public.qa_inspections
  FOR UPDATE USING (created_by = auth.uid());

-- Checklist items policies - based on inspection ownership
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

-- Re-create the full access policies for huy.nguyen@dcsquared.com.au
CREATE POLICY "Full access user can view all projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can update all projects" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can insert all projects" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can delete all projects" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can view all QA inspections" ON public.qa_inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can manage all QA inspections" ON public.qa_inspections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Full access user can manage all checklist items" ON public.qa_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );
