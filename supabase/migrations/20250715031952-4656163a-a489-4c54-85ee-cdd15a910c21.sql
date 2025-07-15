-- Step 1: Remove policies that depend on profiles.role column

-- Drop existing policies that reference profiles.role
DROP POLICY IF EXISTS "Project managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can view all onboarding states" ON public.user_onboarding_state;

-- Update the handle_new_user function to not set role anymore
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

-- Now remove the legacy role column from profiles table
ALTER TABLE public.profiles DROP COLUMN role;

-- Recreate policies using organization_users roles instead
CREATE POLICY "Project managers can create projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = auth.uid() 
    AND ou.role IN ('org_admin', 'project_manager')
    AND ou.status = 'active'
  )
);

CREATE POLICY "Project managers can update projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (
  project_manager_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = auth.uid() 
    AND ou.role IN ('org_admin', 'project_manager')
    AND ou.status = 'active'
  )
);

CREATE POLICY "Admins can view all onboarding states" 
ON public.user_onboarding_state 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = auth.uid() 
    AND ou.role = 'org_admin'
    AND ou.status = 'active'
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.is_developer = true
  )
);