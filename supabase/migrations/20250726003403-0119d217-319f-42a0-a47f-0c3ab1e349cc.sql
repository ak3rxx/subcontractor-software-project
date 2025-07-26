-- Phase 1: Enhance Tasks table schema for cross-linked task management

-- Add missing fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS linked_module text,
ADD COLUMN IF NOT EXISTS linked_id uuid,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments text;

-- Update status enum to include blocked
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked'));

-- Add constraint for priority
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high'));

-- Add constraint for category
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_category_check 
CHECK (category IN ('general', 'trade', 'qa', 'admin', 'safety', 'variation', 'rfi', 'delivery', 'milestone'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_linked_module ON public.tasks(linked_module);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Huy full access to all tasks" ON public.tasks;

-- Create comprehensive RLS policies
CREATE POLICY "Org members can view tasks in their projects" 
ON public.tasks 
FOR SELECT 
USING (
  project_id IN (
    SELECT p.id FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  ) OR assigned_to = auth.uid() OR created_by = auth.uid()
);

CREATE POLICY "Org members can create tasks in their projects" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p 
    WHERE p.organization_id = ANY (get_user_organization_ids())
  ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update tasks assigned to them or created by them" 
ON public.tasks 
FOR UPDATE 
USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "PMs can manage all tasks in their projects" 
ON public.tasks 
FOR ALL 
USING (
  project_id IN (
    SELECT id FROM projects 
    WHERE project_manager_id = auth.uid()
  )
);

CREATE POLICY "Org admins can manage all tasks in their organization" 
ON public.tasks 
FOR ALL 
USING (
  project_id IN (
    SELECT p.id FROM projects p 
    WHERE p.organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role = 'org_admin' 
      AND status = 'active'
    )
  )
);

-- Create function to generate task reference numbers
CREATE OR REPLACE FUNCTION public.generate_task_number(project_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
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
  
  -- Get the current count of tasks for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.tasks 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-TSK-NNNN (e.g., 001-TSK-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-TSK-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$;

-- Create function to generate RFI reference numbers
CREATE OR REPLACE FUNCTION public.generate_rfi_number(project_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
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
  
  -- Get the current count of RFIs for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.rfis 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-RFI-NNNN (e.g., 001-RFI-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-RFI-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$;

-- Add reference_number column to rfis if not exists
ALTER TABLE public.rfis 
ADD COLUMN IF NOT EXISTS reference_number text;

-- Update existing RFIs without reference numbers
UPDATE public.rfis 
SET reference_number = generate_rfi_number(project_id)
WHERE reference_number IS NULL;

-- Add reference_number to tasks if not exists  
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_number text;

-- Update existing tasks without reference numbers
UPDATE public.tasks 
SET task_number = generate_task_number(project_id)
WHERE task_number IS NULL AND project_id IS NOT NULL;