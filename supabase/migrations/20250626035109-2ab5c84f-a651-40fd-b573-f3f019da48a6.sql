
-- Phase 1: Fix Database Role Constraints and User Profiles (Fixed)
-- Drop any existing role check constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update all profiles with invalid roles to have valid ones based on organization matrix
-- Set 'full_access' users to 'org_admin' with developer flag
UPDATE public.profiles 
SET role = 'org_admin', is_developer = true
WHERE role = 'full_access';

-- Set any NULL or invalid roles to 'client' as default
UPDATE public.profiles 
SET role = 'client' 
WHERE role IS NULL OR role NOT IN ('developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client');

-- Add the proper role constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client'));

-- Create table to track role assignment requests and notifications
CREATE TABLE IF NOT EXISTS public.role_assignment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  requested_role TEXT,
  existing_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reason TEXT,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create role validation status tracking
CREATE TABLE IF NOT EXISTS public.user_role_validation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  validation_status TEXT NOT NULL DEFAULT 'pending', -- 'valid', 'invalid', 'unassigned', 'pending_assignment'
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  last_validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.role_assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_validation ENABLE ROW LEVEL SECURITY;

-- RLS policies for role assignment requests
CREATE POLICY "Users can view their own role requests" 
  ON public.role_assignment_requests 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can view requests for their organization" 
  ON public.role_assignment_requests 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active' 
      AND role IN ('org_admin')
    )
  );

CREATE POLICY "Org admins can manage requests for their organization" 
  ON public.role_assignment_requests 
  FOR ALL 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active' 
      AND role IN ('org_admin')
    )
  );

-- RLS policies for role validation
CREATE POLICY "Users can view their own validation status" 
  ON public.user_role_validation 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can view validation for their organization" 
  ON public.user_role_validation 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users 
      WHERE user_id = auth.uid() AND status = 'active' 
      AND role IN ('org_admin')
    )
  );

-- Initialize role validation for existing users
INSERT INTO public.user_role_validation (user_id, validation_status, organization_id)
SELECT 
  p.id,
  CASE 
    WHEN p.role IN ('developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client') THEN 'valid'
    ELSE 'invalid'
  END,
  ou.organization_id
FROM public.profiles p
LEFT JOIN public.organization_users ou ON ou.user_id = p.id AND ou.status = 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_role_validation urv 
  WHERE urv.user_id = p.id
);
