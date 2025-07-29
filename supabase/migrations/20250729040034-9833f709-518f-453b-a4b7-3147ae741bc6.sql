-- Drop existing constraints that need updating
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_category_check;

-- Recreate status constraint with new values
ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked', 'delayed', 'overdue'));

-- Recreate category constraint with new values  
ALTER TABLE public.tasks ADD CONSTRAINT tasks_category_check 
CHECK (category IN ('general', 'trade', 'qa', 'admin', 'safety', 'variation', 'rfi', 'delivery', 'milestone', 'finance'));