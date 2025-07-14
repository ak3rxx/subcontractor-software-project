-- Grant comprehensive access to huy.nguyen@dcsquared.com.au user
-- Update profile to ensure full developer access
UPDATE public.profiles 
SET is_developer = true, 
    role = 'org_admin',
    updated_at = now()
WHERE email = 'huy.nguyen@dcsquared.com.au';

-- Ensure the user has org_admin role in all organizations they should access
-- First, create a default organization for huy if none exists
INSERT INTO public.organizations (name, slug, license_count, created_by)
SELECT 
  'Huy Admin Organization',
  'huy-admin-org-' || substr(gen_random_uuid()::text, 1, 8),
  100, -- Large license count
  id
FROM public.profiles 
WHERE email = 'huy.nguyen@dcsquared.com.au'
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_users ou 
    WHERE ou.user_id = profiles.id 
    AND ou.status = 'active'
  );

-- Add huy as org_admin to the organization
INSERT INTO public.organization_users (organization_id, user_id, role, status, joined_at, approved_at)
SELECT 
  o.id,
  p.id,
  'org_admin',
  'active',
  now(),
  now()
FROM public.profiles p
CROSS JOIN public.organizations o
WHERE p.email = 'huy.nguyen@dcsquared.com.au'
  AND o.name = 'Huy Admin Organization'
ON CONFLICT (organization_id, user_id) 
DO UPDATE SET 
  role = 'org_admin',
  status = 'active',
  approved_at = now();

-- Create comprehensive RLS policies for huy's full access
-- Projects full access
CREATE POLICY "Huy full access to all projects" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

-- Organizations full access  
CREATE POLICY "Huy full access to all organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

-- Organization users full access
CREATE POLICY "Huy full access to all organization users" ON public.organization_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

-- Add full access to all other important tables
CREATE POLICY "Huy full access to all tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Huy full access to all rfis" ON public.rfis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );

CREATE POLICY "Huy full access to all documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND email = 'huy.nguyen@dcsquared.com.au'
    )
  );