-- Fix infinite recursion in organization_users RLS policies
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Org admins can manage organization users" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view org memberships they have access to" ON public.organization_users;

-- Create a security definer function to safely check organization access
CREATE OR REPLACE FUNCTION public.check_organization_access(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = org_id
      AND ou.user_id = user_id
      AND ou.status = 'active'
  );
$$;

-- Create a security definer function to check if user is org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = org_id
      AND ou.user_id = user_id
      AND ou.role = 'org_admin'
      AND ou.status = 'active'
  );
$$;

-- Create safe RLS policies using security definer functions
CREATE POLICY "Safe org admin management" 
ON public.organization_users 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()))
WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Safe user view access" 
ON public.organization_users 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.check_organization_access(organization_id, auth.uid())
);