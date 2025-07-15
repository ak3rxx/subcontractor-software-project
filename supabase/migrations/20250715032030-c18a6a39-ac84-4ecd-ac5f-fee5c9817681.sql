-- Clean up organization_users data to ensure all users have proper organization membership
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