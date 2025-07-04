-- Ensure proper organization creation triggers are in place

-- Update the trigger function to create organization settings when organization is created
CREATE OR REPLACE FUNCTION public.create_default_organization_with_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a default organization for the user
  INSERT INTO public.organizations (name, slug, license_count, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company', NEW.email || '''s Organization'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company', NEW.email), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8),
    5, -- default license count
    NEW.id
  )
  RETURNING id INTO new_org_id;
  
  -- Add the user as org admin to their default organization
  INSERT INTO public.organization_users (organization_id, user_id, role, status, joined_at, approved_at, approved_by)
  VALUES (new_org_id, NEW.id, 'org_admin', 'active', NOW(), NOW(), NEW.id);
  
  -- Create default organization settings
  INSERT INTO public.organization_settings (organization_id)
  VALUES (new_org_id);
  
  RETURN NEW;
END;
$$;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
CREATE TRIGGER on_auth_user_created_org
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_organization_with_settings();

-- Add function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(invitation_token UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  user_id UUID;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE invitation_token = accept_organization_invitation.invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user email matches invitation
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id AND email = invitation_record.email) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email does not match invitation');
  END IF;
  
  -- Add user to organization
  INSERT INTO organization_users (organization_id, user_id, role, status, joined_at, approved_at, approved_by, invited_by)
  VALUES (
    invitation_record.organization_id,
    user_id,
    invitation_record.role,
    'active',
    NOW(),
    NOW(),
    invitation_record.invited_by,
    invitation_record.invited_by
  )
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET
    role = invitation_record.role,
    status = 'active',
    approved_at = NOW(),
    approved_by = invitation_record.invited_by;
  
  -- Mark invitation as accepted
  UPDATE organization_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully joined organization',
    'organization_id', invitation_record.organization_id,
    'role', invitation_record.role
  );
END;
$$;

-- Function to get pending invitations for an organization
CREATE OR REPLACE FUNCTION public.get_organization_invitations(org_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  invited_by_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.id,
    oi.email,
    oi.role,
    oi.status,
    oi.created_at,
    oi.expires_at,
    COALESCE(p.full_name, p.email, 'Unknown') as invited_by_name
  FROM organization_invitations oi
  LEFT JOIN profiles p ON p.id = oi.invited_by
  WHERE oi.organization_id = org_id
  ORDER BY oi.created_at DESC;
END;
$$;