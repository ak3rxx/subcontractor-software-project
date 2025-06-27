
-- Create comprehensive audit trail table for variation changes
CREATE TABLE IF NOT EXISTS public.variation_audit_trail (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  variation_id uuid NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  action_type text NOT NULL CHECK (action_type IN ('create', 'edit', 'submit', 'approve', 'reject', 'unlock', 'email_sent')),
  field_name text,
  old_value text,
  new_value text,
  status_from text,
  status_to text,
  comments text,
  metadata jsonb DEFAULT '{}',
  action_timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_variation_audit_trail_variation_id ON variation_audit_trail(variation_id);
CREATE INDEX idx_variation_audit_trail_timestamp ON variation_audit_trail(action_timestamp DESC);
CREATE INDEX idx_variation_audit_trail_action_type ON variation_audit_trail(action_type);

-- Enable RLS
ALTER TABLE variation_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit trail
CREATE POLICY "Users can view audit trail for accessible variations"
ON variation_audit_trail FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM variations v 
    WHERE v.id = variation_audit_trail.variation_id
  )
);

-- Allow authenticated users to insert audit records
CREATE POLICY "Allow audit trail inserts"
ON variation_audit_trail FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to log variation changes
CREATE OR REPLACE FUNCTION public.log_variation_change(
  p_variation_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_field_name text DEFAULT NULL,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_status_from text DEFAULT NULL,
  p_status_to text DEFAULT NULL,
  p_comments text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO variation_audit_trail (
    variation_id,
    user_id,
    action_type,
    field_name,
    old_value,
    new_value,
    status_from,
    status_to,
    comments,
    metadata
  ) VALUES (
    p_variation_id,
    p_user_id,
    p_action_type,
    p_field_name,
    p_old_value,
    p_new_value,
    p_status_from,
    p_status_to,
    p_comments,
    p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Create function to get variation audit history
CREATE OR REPLACE FUNCTION public.get_variation_audit_history(p_variation_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  action_type text,
  field_name text,
  old_value text,
  new_value text,
  status_from text,
  status_to text,
  comments text,
  metadata jsonb,
  action_timestamp timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vat.id,
    vat.user_id,
    COALESCE(p.full_name, p.email, 'Unknown User') as user_name,
    vat.action_type,
    vat.field_name,
    vat.old_value,
    vat.new_value,
    vat.status_from,
    vat.status_to,
    vat.comments,
    vat.metadata,
    vat.action_timestamp
  FROM variation_audit_trail vat
  LEFT JOIN profiles p ON p.id = vat.user_id
  WHERE vat.variation_id = p_variation_id
  ORDER BY vat.action_timestamp DESC;
END;
$$;

-- Fix existing RLS policies for variations table to ensure proper access
DROP POLICY IF EXISTS "Developers can manage all variations" ON variations;
CREATE POLICY "Allow authenticated users to manage variations"
ON variations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger function to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_variation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO variation_audit_trail (
      variation_id,
      user_id,
      action_type,
      status_from,
      status_to,
      comments,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'pending_approval' THEN 'submit'
        WHEN NEW.status = 'approved' THEN 'approve'
        WHEN NEW.status = 'rejected' THEN 'reject'
        WHEN NEW.status = 'draft' AND OLD.status IN ('approved', 'rejected') THEN 'unlock'
        ELSE 'edit'
      END,
      OLD.status,
      NEW.status,
      NEW.approval_comments,
      jsonb_build_object(
        'approved_by', NEW.approved_by,
        'approval_date', NEW.approval_date,
        'request_date', NEW.request_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS variation_status_change_trigger ON variations;
CREATE TRIGGER variation_status_change_trigger
  AFTER UPDATE ON variations
  FOR EACH ROW
  EXECUTE FUNCTION log_variation_status_change();
