-- Add foreign key constraint to task_assignments pointing to profiles table
-- This will fix the relationship query issue
ALTER TABLE public.task_assignments 
ADD CONSTRAINT fk_task_assignments_user_id_profiles 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;