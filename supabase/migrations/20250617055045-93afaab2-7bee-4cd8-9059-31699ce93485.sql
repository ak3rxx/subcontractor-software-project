
-- Update the profiles table role constraint to include the new roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint with all roles including 'subcontractor' and 'full_access'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('project_manager', 'estimator', 'finance_manager', 'site_supervisor', 'client', 'subcontractor', 'full_access'));
