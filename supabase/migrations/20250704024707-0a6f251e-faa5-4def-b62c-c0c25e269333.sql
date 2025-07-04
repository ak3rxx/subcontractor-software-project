-- Phase 2: Enhance Current Database Structure
-- Add beneficial fields from proposed structure while maintaining existing functionality

-- Enhance organizations table with additional fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS dob_admin DATE,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#2563eb';

-- Enhance organization_users table
ALTER TABLE organization_users 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Enhance organization_invitations table  
ALTER TABLE organization_invitations
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Update onboarding_states to support module-level tracking
ALTER TABLE onboarding_states
ADD COLUMN IF NOT EXISTS module_name TEXT,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS show_again BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_user_org_module 
ON onboarding_states(user_id, organization_id, module_name);

-- Update organization_users status when invitation is accepted
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- When invitation is accepted, activate the user
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE organization_users 
    SET status = 'active', 
        approved_at = NOW(),
        approved_by = (SELECT invited_by FROM organization_invitations WHERE id = NEW.id)
    WHERE organization_id = NEW.organization_id 
    AND user_id = (SELECT id FROM auth.users WHERE email = NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invitation acceptance
DROP TRIGGER IF EXISTS trigger_invitation_acceptance ON organization_invitations;
CREATE TRIGGER trigger_invitation_acceptance
  AFTER UPDATE ON organization_invitations
  FOR EACH ROW EXECUTE FUNCTION handle_invitation_acceptance();

-- Function to track module-specific onboarding progress
CREATE OR REPLACE FUNCTION update_onboarding_module_progress(
  p_user_id UUID,
  p_organization_id UUID,
  p_module_name TEXT,
  p_completed BOOLEAN DEFAULT false,
  p_show_again BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  onboarding_id UUID;
BEGIN
  INSERT INTO onboarding_states (
    user_id,
    organization_id,
    role,
    module_name,
    is_completed,
    show_again,
    last_seen
  ) VALUES (
    p_user_id,
    p_organization_id,
    COALESCE((SELECT role FROM organization_users WHERE user_id = p_user_id AND organization_id = p_organization_id), 'user'),
    p_module_name,
    p_completed,
    p_show_again,
    now()
  )
  ON CONFLICT (user_id, organization_id) 
  DO UPDATE SET
    module_name = p_module_name,
    is_completed = p_completed,
    show_again = p_show_again,
    last_seen = now(),
    updated_at = now()
  RETURNING id INTO onboarding_id;
  
  RETURN onboarding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should see onboarding for a module
CREATE OR REPLACE FUNCTION should_show_onboarding(
  p_user_id UUID,
  p_organization_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM onboarding_states
    WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND module_name = p_module_name
    AND (is_completed = true OR show_again = false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;