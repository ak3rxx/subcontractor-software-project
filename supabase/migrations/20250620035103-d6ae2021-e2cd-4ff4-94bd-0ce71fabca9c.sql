
-- Create full access policies for huy.nguyen@dcsquared.com.au
-- First, we need to get the user ID for this email from the profiles table

-- Grant full access to projects for the specific user
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

-- Grant full access to QA inspections
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

-- Grant full access to checklist items
CREATE POLICY "Full access user can manage all checklist items" ON public.qa_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

-- Update the user's role to full_access in profiles table
UPDATE public.profiles 
SET role = 'full_access' 
WHERE email = 'huy.nguyen@dcsquared.com.au';
