-- Phase 1: Enhance Tasks table schema for cross-linked task management (corrected)

-- Add missing fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS linked_module text,
ADD COLUMN IF NOT EXISTS linked_id uuid,
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS comments text;

-- Drop existing constraints if they exist
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;

-- Add updated constraints
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked'));

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_category_check 
CHECK (category IN ('general', 'trade', 'qa', 'admin', 'safety', 'variation', 'rfi', 'delivery', 'milestone'));

-- Create indexes for better performance
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

-- Add reference_number to tasks if not exists  
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS task_number text;

-- Add reference_number column to rfis if not exists
ALTER TABLE public.rfis 
ADD COLUMN IF NOT EXISTS reference_number text;