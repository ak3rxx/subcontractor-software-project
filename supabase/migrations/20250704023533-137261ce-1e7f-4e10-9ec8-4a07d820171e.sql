-- Phase 1: Clean Slate Database Schema
-- Drop old broken permission structures
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_role_validation CASCADE;

-- Update organizations table with required fields for construction SaaS
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS trial_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '15 days'),
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS branding_settings JSONB DEFAULT '{}';

-- Update organization_users to be the single source of truth for roles
ALTER TABLE organization_users 
DROP CONSTRAINT IF EXISTS organization_users_role_check,
ADD CONSTRAINT organization_users_role_check 
CHECK (role IN ('developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client'));

-- Create onboarding_states table for AI-guided tours
CREATE TABLE IF NOT EXISTS onboarding_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  completed_steps JSONB DEFAULT '[]',
  current_step TEXT,
  is_completed BOOLEAN DEFAULT false,
  tour_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on onboarding_states
ALTER TABLE onboarding_states ENABLE ROW LEVEL SECURITY;

-- Create onboarding RLS policies
CREATE POLICY "Users can manage their own onboarding state"
ON onboarding_states FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Org admins can view onboarding states in their organization"
ON onboarding_states FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM organization_users 
  WHERE user_id = auth.uid() AND role = 'org_admin' AND status = 'active'
));

-- Update organization_invitations with proper expiration logic
ALTER TABLE organization_invitations 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '3 days');

-- Create organization_settings table for branding and configuration
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#1e40af',
  default_folder_structure JSONB DEFAULT '["Drawings", "Specifications", "Contracts", "QA Documents", "Site Photos", "SWMS", "Insurance", "Licenses"]',
  email_templates JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Create organization_settings RLS policies
CREATE POLICY "Org members can view their organization settings"
ON organization_settings FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM organization_users 
  WHERE user_id = auth.uid() AND status = 'active'
));

CREATE POLICY "Org admins can manage their organization settings"
ON organization_settings FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM organization_users 
  WHERE user_id = auth.uid() AND role = 'org_admin' AND status = 'active'
));

-- Create sample projects table for auto-generated content
CREATE TABLE IF NOT EXISTS sample_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL DEFAULT 'Sample Project',
  project_type TEXT DEFAULT 'residential',
  folder_structure JSONB DEFAULT '[]',
  template_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sample_projects
ALTER TABLE sample_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their sample projects"
ON sample_projects FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM organization_users 
  WHERE user_id = auth.uid() AND status = 'active'
));

-- Create function to get user role in organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM organization_users 
  WHERE organization_id = org_id AND user_id = get_user_role_in_org.user_id AND status = 'active'
  LIMIT 1;
$$;

-- Create function to check if user is org admin
CREATE OR REPLACE FUNCTION is_org_admin_simple(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_users 
    WHERE organization_id = org_id 
    AND user_id = is_org_admin_simple.user_id 
    AND role = 'org_admin' 
    AND status = 'active'
  );
$$;

-- Create function to get user's primary organization
CREATE OR REPLACE FUNCTION get_user_primary_org(user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM organization_users 
  WHERE user_id = get_user_primary_org.user_id AND status = 'active'
  ORDER BY joined_at ASC
  LIMIT 1;
$$;