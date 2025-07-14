-- Create a new function to get invitation details without authentication
CREATE OR REPLACE FUNCTION public.get_invitation_details(invitation_token UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Get invitation details with organization and inviter info
  SELECT 
    oi.id,
    oi.email,
    oi.role,
    oi.status,
    oi.expires_at,
    o.name as organization_name,
    COALESCE(p.full_name, p.email, 'Unknown') as invited_by_name
  INTO invitation_record
  FROM organization_invitations oi
  LEFT JOIN organizations o ON o.id = oi.organization_id
  LEFT JOIN profiles p ON p.id = oi.invited_by
  WHERE oi.invitation_token = get_invitation_details.invitation_token
    AND oi.status = 'pending';
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid invitation token');
  END IF;
  
  -- Check if invitation is expired
  IF invitation_record.expires_at IS NOT NULL AND invitation_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', 'This invitation has expired');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation', jsonb_build_object(
      'id', invitation_record.id,
      'email', invitation_record.email,
      'role', invitation_record.role,
      'organization_name', invitation_record.organization_name,
      'invited_by_name', invitation_record.invited_by_name,
      'expires_at', invitation_record.expires_at
    )
  );
END;
$$;

-- Update the accept invitation function to handle email verification better
CREATE OR REPLACE FUNCTION public.accept_organization_invitation(invitation_token UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  user_id UUID;
  user_email TEXT;
BEGIN
  -- Get current user
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not authenticated');
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User email not found');
  END IF;
  
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM organization_invitations
  WHERE invitation_token = accept_organization_invitation.invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user email matches invitation (case insensitive)
  IF LOWER(user_email) != LOWER(invitation_record.email) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'This invitation was sent to ' || invitation_record.email || ' but you are signed in as ' || user_email
    );
  END IF;
  
  -- Check if user is already in the organization
  IF EXISTS (SELECT 1 FROM organization_users WHERE organization_id = invitation_record.organization_id AND user_id = user_id) THEN
    -- Update existing membership
    UPDATE organization_users 
    SET 
      role = invitation_record.role,
      status = 'active',
      approved_at = NOW(),
      approved_by = invitation_record.invited_by
    WHERE organization_id = invitation_record.organization_id AND user_id = user_id;
  ELSE
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
    );
  END IF;
  
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