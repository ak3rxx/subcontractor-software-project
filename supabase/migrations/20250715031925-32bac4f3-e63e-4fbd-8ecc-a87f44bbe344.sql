-- Remove legacy role column from profiles table and update handle_new_user function
-- This will fix the conflict between profiles.role and organization_users.role

-- First, update the handle_new_user function to not set role anymore
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

-- Remove the legacy role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Clean up any inconsistent organization_users data
-- Ensure all users have an organization_users record with proper role
INSERT INTO public.organization_users (organization_id, user_id, role, status, joined_at, approved_at, approved_by)
SELECT 
  o.id as organization_id,
  p.id as user_id,
  'org_admin' as role,
  'active' as status,
  NOW() as joined_at,
  NOW() as approved_at,
  p.id as approved_by
FROM public.profiles p
CROSS JOIN public.organizations o
WHERE o.created_by = p.id
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_users ou 
    WHERE ou.user_id = p.id AND ou.organization_id = o.id
  );

-- For any remaining users without organization membership, add them to their first available org as users
INSERT INTO public.organization_users (organization_id, user_id, role, status, joined_at, approved_at)
SELECT 
  (SELECT id FROM public.organizations LIMIT 1) as organization_id,
  p.id as user_id,
  'user' as role,
  'active' as status,
  NOW() as joined_at,
  NOW() as approved_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_users ou 
  WHERE ou.user_id = p.id
);