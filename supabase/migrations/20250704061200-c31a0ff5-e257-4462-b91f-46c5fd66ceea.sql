-- Add huy user to a GSC organization
-- First, let's create the GSC organization if it doesn't exist
INSERT INTO organizations (id, name, slug, license_count, created_by, subscription_status)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Grandscale Construction',
  'gsc',
  10,
  'c387bab4-dc2e-4245-84e6-1c1fb45b1809',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- Add huy as org admin to GSC organization  
INSERT INTO organization_users (
  organization_id, 
  user_id, 
  role, 
  status, 
  joined_at, 
  approved_at, 
  approved_by
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'c387bab4-dc2e-4245-84e6-1c1fb45b1809',
  'org_admin',
  'active',
  NOW(),
  NOW(),
  'c387bab4-dc2e-4245-84e6-1c1fb45b1809'
) ON CONFLICT (organization_id, user_id) 
DO UPDATE SET 
  role = 'org_admin',
  status = 'active',
  approved_at = NOW();

-- Create organization settings for GSC
INSERT INTO organization_settings (organization_id)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479')
ON CONFLICT (organization_id) DO NOTHING;