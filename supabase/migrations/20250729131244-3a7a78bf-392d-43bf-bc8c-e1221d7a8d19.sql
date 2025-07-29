-- Create RLS policies for programme_milestones table
-- Allow users to manage milestones for their projects
CREATE POLICY "Users can view milestones for their projects" 
ON public.programme_milestones 
FOR SELECT 
USING (
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.project_manager_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

CREATE POLICY "Users can create milestones for their projects" 
ON public.programme_milestones 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.project_manager_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

CREATE POLICY "Users can update milestones for their projects" 
ON public.programme_milestones 
FOR UPDATE 
USING (
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.project_manager_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

CREATE POLICY "Users can delete milestones for their projects" 
ON public.programme_milestones 
FOR DELETE 
USING (
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.project_manager_id = auth.uid()
  )
  OR
  project_id IN (
    SELECT p.id 
    FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

-- Add a special policy for developers/admin access
CREATE POLICY "Developers can manage all milestones" 
ON public.programme_milestones 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_developer = true
  )
);