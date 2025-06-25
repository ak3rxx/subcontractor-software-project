
-- Create role permissions table to define what each role can access
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  permission_level TEXT NOT NULL, -- 'none', 'read', 'write', 'admin'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

-- Create feature flags table for developer controls
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user onboarding state tracking
CREATE TABLE public.user_onboarding_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL,
  completed_steps JSONB NOT NULL DEFAULT '[]',
  current_step TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create system diagnostics table for health monitoring
CREATE TABLE public.system_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pass', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_developer flag to profiles for Developer role identification
ALTER TABLE public.profiles 
ADD COLUMN is_developer BOOLEAN NOT NULL DEFAULT false;

-- Insert role permissions for all 8 roles and modules
INSERT INTO public.role_permissions (role, module, permission_level) VALUES
-- Developer (owner) - Full system access
('developer', 'admin_panel', 'admin'),
('developer', 'organization_panel', 'admin'),
('developer', 'projects', 'admin'),
('developer', 'tasks', 'admin'),
('developer', 'rfis', 'admin'),
('developer', 'qa_itp', 'admin'),
('developer', 'variations', 'admin'),
('developer', 'finance', 'admin'),
('developer', 'documents', 'admin'),
('developer', 'programme', 'admin'),
('developer', 'deliveries', 'admin'),
('developer', 'handovers', 'admin'),
('developer', 'notes', 'admin'),
('developer', 'onboarding', 'admin'),
('developer', 'diagnostics', 'admin'),

-- Organisation Admin - Org panel + user management
('org_admin', 'admin_panel', 'none'),
('org_admin', 'organization_panel', 'admin'),
('org_admin', 'projects', 'read'),
('org_admin', 'tasks', 'read'),
('org_admin', 'rfis', 'read'),
('org_admin', 'qa_itp', 'read'),
('org_admin', 'variations', 'read'),
('org_admin', 'finance', 'read'),
('org_admin', 'documents', 'write'),
('org_admin', 'programme', 'read'),
('org_admin', 'deliveries', 'read'),
('org_admin', 'handovers', 'read'),
('org_admin', 'notes', 'read'),
('org_admin', 'onboarding', 'write'),
('org_admin', 'diagnostics', 'none'),

-- Project Manager - Full access to all project modules
('project_manager', 'admin_panel', 'none'),
('project_manager', 'organization_panel', 'none'),
('project_manager', 'projects', 'write'),
('project_manager', 'tasks', 'write'),
('project_manager', 'rfis', 'write'),
('project_manager', 'qa_itp', 'write'),
('project_manager', 'variations', 'write'),
('project_manager', 'finance', 'write'),
('project_manager', 'documents', 'write'),
('project_manager', 'programme', 'write'),
('project_manager', 'deliveries', 'write'),
('project_manager', 'handovers', 'write'),
('project_manager', 'notes', 'write'),
('project_manager', 'onboarding', 'none'),
('project_manager', 'diagnostics', 'none'),

-- Estimator/Contract Admin - Finance, Docs, RFIs, Tasks, Variations
('estimator', 'admin_panel', 'none'),
('estimator', 'organization_panel', 'none'),
('estimator', 'projects', 'read'),
('estimator', 'tasks', 'write'),
('estimator', 'rfis', 'write'),
('estimator', 'qa_itp', 'read'),
('estimator', 'variations', 'write'),
('estimator', 'finance', 'write'),
('estimator', 'documents', 'write'),
('estimator', 'programme', 'read'),
('estimator', 'deliveries', 'write'),
('estimator', 'handovers', 'write'),
('estimator', 'notes', 'write'),
('estimator', 'onboarding', 'none'),
('estimator', 'diagnostics', 'none'),

-- Admin/Project Engineer - QA/ITPs, Docs, Tasks, RFIs + submit-only budgets
('admin', 'admin_panel', 'none'),
('admin', 'organization_panel', 'none'),
('admin', 'projects', 'read'),
('admin', 'tasks', 'write'),
('admin', 'rfis', 'write'),
('admin', 'qa_itp', 'write'),
('admin', 'variations', 'read'),
('admin', 'finance', 'read'),
('admin', 'documents', 'write'),
('admin', 'programme', 'read'),
('admin', 'deliveries', 'read'),
('admin', 'handovers', 'read'),
('admin', 'notes', 'write'),
('admin', 'onboarding', 'write'),
('admin', 'diagnostics', 'none'),

-- Site Supervisor - Programme view + edit Tasks, ITPs, Handovers
('site_supervisor', 'admin_panel', 'none'),
('site_supervisor', 'organization_panel', 'none'),
('site_supervisor', 'projects', 'read'),
('site_supervisor', 'tasks', 'write'),
('site_supervisor', 'rfis', 'read'),
('site_supervisor', 'qa_itp', 'write'),
('site_supervisor', 'variations', 'none'),
('site_supervisor', 'finance', 'none'),
('site_supervisor', 'documents', 'read'),
('site_supervisor', 'programme', 'read'),
('site_supervisor', 'deliveries', 'write'),
('site_supervisor', 'handovers', 'write'),
('site_supervisor', 'notes', 'write'),
('site_supervisor', 'onboarding', 'none'),
('site_supervisor', 'diagnostics', 'none'),

-- Subcontractor - Assigned tasks only, no finance access
('subcontractor', 'admin_panel', 'none'),
('subcontractor', 'organization_panel', 'none'),
('subcontractor', 'projects', 'none'),
('subcontractor', 'tasks', 'read'),
('subcontractor', 'rfis', 'read'),
('subcontractor', 'qa_itp', 'read'),
('subcontractor', 'variations', 'none'),
('subcontractor', 'finance', 'none'),
('subcontractor', 'documents', 'none'),
('subcontractor', 'programme', 'none'),
('subcontractor', 'deliveries', 'none'),
('subcontractor', 'handovers', 'none'),
('subcontractor', 'notes', 'read'),
('subcontractor', 'onboarding', 'none'),
('subcontractor', 'diagnostics', 'none'),

-- Client/Builder - Read-only filtered reports
('client', 'admin_panel', 'none'),
('client', 'organization_panel', 'none'),
('client', 'projects', 'read'),
('client', 'tasks', 'none'),
('client', 'rfis', 'none'),
('client', 'qa_itp', 'none'),
('client', 'variations', 'read'),
('client', 'finance', 'none'),
('client', 'documents', 'read'),
('client', 'programme', 'read'),
('client', 'deliveries', 'none'),
('client', 'handovers', 'none'),
('client', 'notes', 'none'),
('client', 'onboarding', 'none'),
('client', 'diagnostics', 'none');

-- Insert initial feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, description) VALUES
('ai_assistant', true, 'Enable AI assistant and smart suggestions'),
('advanced_diagnostics', true, 'Enable advanced system diagnostics'),
('onboarding_system', true, 'Enable role-based onboarding system'),
('test_user_mode', true, 'Allow developers to test as different roles'),
('organization_branding', true, 'Enable custom branding for organizations'),
('document_compliance', true, 'Enable document compliance tracking');

-- Enable Row Level Security on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_diagnostics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Role permissions: Only developers can modify, everyone can read their own permissions
CREATE POLICY "Developers can manage role permissions" 
  ON public.role_permissions 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_developer = true));

CREATE POLICY "Users can view role permissions" 
  ON public.role_permissions 
  FOR SELECT 
  USING (true);

-- Feature flags: Only developers can access
CREATE POLICY "Developers can manage feature flags" 
  ON public.feature_flags 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_developer = true));

-- User onboarding: Users can manage their own state
CREATE POLICY "Users can manage their onboarding state" 
  ON public.user_onboarding_state 
  FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding states" 
  ON public.user_onboarding_state 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_developer = true OR role = 'org_admin')));

-- System diagnostics: Only developers can access
CREATE POLICY "Developers can manage diagnostics" 
  ON public.system_diagnostics 
  FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_developer = true));
