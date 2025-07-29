-- Create task_assignments table for multi-user assignment support
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Add foreign key constraints
ALTER TABLE public.task_assignments 
ADD CONSTRAINT fk_task_assignments_task_id 
FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);

-- Enable Row Level Security
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_assignments
CREATE POLICY "Org members can view task assignments for their projects" 
ON public.task_assignments 
FOR SELECT 
USING (
  task_id IN (
    SELECT t.id 
    FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

CREATE POLICY "Org members can create task assignments for their projects" 
ON public.task_assignments 
FOR INSERT 
WITH CHECK (
  task_id IN (
    SELECT t.id 
    FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE p.organization_id = ANY (get_user_organization_ids())
  ) AND assigned_by = auth.uid()
);

CREATE POLICY "Org members can delete task assignments for their projects" 
ON public.task_assignments 
FOR DELETE 
USING (
  task_id IN (
    SELECT t.id 
    FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE p.organization_id = ANY (get_user_organization_ids())
  )
);

CREATE POLICY "Org admins can manage all task assignments in their organization" 
ON public.task_assignments 
FOR ALL 
USING (
  task_id IN (
    SELECT t.id 
    FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE p.organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role = 'org_admin' 
      AND status = 'active'
    )
  )
);

CREATE POLICY "PMs can manage all task assignments in their projects" 
ON public.task_assignments 
FOR ALL 
USING (
  task_id IN (
    SELECT t.id 
    FROM public.tasks t
    JOIN public.projects p ON t.project_id = p.id
    WHERE p.project_manager_id = auth.uid()
  )
);