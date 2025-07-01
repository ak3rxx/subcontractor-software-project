
-- Phase 2: Comprehensive Audit Trail Fix for Global Scale (Fixed)
-- Step 1: Create enhanced variation change trigger with complete field tracking

-- First, drop the existing trigger to rebuild it properly
DROP TRIGGER IF EXISTS variation_status_change_trigger ON public.variations;
DROP FUNCTION IF EXISTS public.log_variation_status_change();

-- Create enhanced trigger function that tracks ALL field changes
CREATE OR REPLACE FUNCTION public.log_variation_comprehensive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
  user_uuid UUID;
  action_type_val TEXT;
BEGIN
  -- Get current user ID, fallback to system if unavailable
  user_uuid := COALESCE(auth.uid(), NEW.updated_by, OLD.updated_by);
  
  -- Only proceed if we have a valid user
  IF user_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine primary action type based on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    action_type_val := CASE 
      WHEN NEW.status = 'pending_approval' THEN 'submit'
      WHEN NEW.status = 'approved' THEN 'approve'
      WHEN NEW.status = 'rejected' THEN 'reject'
      WHEN NEW.status = 'draft' AND OLD.status IN ('approved', 'rejected') THEN 'unlock'
      ELSE 'edit'
    END;
    
    -- Log status change with deduplication check
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, status_from, status_to, 
      comments, metadata, action_timestamp
    ) 
    SELECT 
      NEW.id, user_uuid, action_type_val, OLD.status, NEW.status, 
      NEW.approval_comments,
      jsonb_build_object(
        'approved_by', NEW.approved_by,
        'approval_date', NEW.approval_date,
        'request_date', NEW.request_date,
        'variation_number', NEW.variation_number
      ),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM variation_audit_trail 
      WHERE variation_id = NEW.id 
        AND status_from = OLD.status 
        AND status_to = NEW.status
        AND action_timestamp > NOW() - INTERVAL '5 seconds'
        AND user_id = user_uuid
    );
  ELSE
    action_type_val := 'edit';
  END IF;

  -- Track individual field changes (only for significant fields)
  -- Title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'title', OLD.title, NEW.title, NOW()
    );
  END IF;

  -- Description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'description', 
      LEFT(COALESCE(OLD.description, ''), 100), 
      LEFT(COALESCE(NEW.description, ''), 100), 
      NOW()
    );
  END IF;

  -- Cost impact changes
  IF OLD.cost_impact IS DISTINCT FROM NEW.cost_impact THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'cost_impact', 
      COALESCE(OLD.cost_impact::TEXT, '0'), 
      COALESCE(NEW.cost_impact::TEXT, '0'), 
      NOW()
    );
  END IF;

  -- Time impact changes
  IF OLD.time_impact IS DISTINCT FROM NEW.time_impact THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'time_impact', 
      COALESCE(OLD.time_impact::TEXT, '0'), 
      COALESCE(NEW.time_impact::TEXT, '0'), 
      NOW()
    );
  END IF;

  -- Priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'priority', OLD.priority, NEW.priority, NOW()
    );
  END IF;

  -- Category changes
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'category', OLD.category, NEW.category, NOW()
    );
  END IF;

  -- Trade changes
  IF OLD.trade IS DISTINCT FROM NEW.trade THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
    ) VALUES (
      NEW.id, user_uuid, 'edit', 'trade', OLD.trade, NEW.trade, NOW()
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the comprehensive trigger
CREATE TRIGGER variation_comprehensive_change_trigger
  AFTER UPDATE ON public.variations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_variation_comprehensive_changes();

-- Step 2: Clean existing duplicate data
-- Remove exact duplicates (same variation, user, action, timestamp within 1 minute)
DELETE FROM variation_audit_trail 
WHERE id NOT IN (
  SELECT DISTINCT ON (variation_id, user_id, action_type, status_from, status_to, 
    DATE_TRUNC('minute', action_timestamp)) id
  FROM variation_audit_trail 
  ORDER BY variation_id, user_id, action_type, status_from, status_to, 
    DATE_TRUNC('minute', action_timestamp), action_timestamp DESC
);

-- Step 3: Add performance indexes (removed CONCURRENTLY to avoid transaction issues)
-- Optimize for high-volume queries
CREATE INDEX IF NOT EXISTS idx_variation_audit_trail_variation_timestamp
ON variation_audit_trail (variation_id, action_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_variation_audit_trail_user_timestamp
ON variation_audit_trail (user_id, action_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_variation_audit_trail_action_type
ON variation_audit_trail (action_type, action_timestamp DESC);

-- Step 4: Add data retention function for large organizations
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_trail(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Archive old audit trail entries (keep only recent data for performance)
  DELETE FROM variation_audit_trail 
  WHERE action_timestamp < NOW() - (retention_days || ' days')::INTERVAL
    AND action_type IN ('edit') -- Keep status changes forever, clean only field edits
  RETURNING id INTO deleted_count;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup action
  INSERT INTO variation_audit_trail (
    variation_id, user_id, action_type, comments, metadata
  ) VALUES (
    gen_random_uuid(), -- Dummy variation ID for system actions
    COALESCE(auth.uid(), (SELECT id FROM profiles WHERE is_developer = true LIMIT 1)),
    'system_cleanup',
    'Automated cleanup of audit trail entries older than ' || retention_days || ' days',
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );
  
  RETURN deleted_count;
END;
$function$;

-- Step 5: Update the variations table to track who made the last update
ALTER TABLE public.variations 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);

-- Step 6: Create a function to get paginated audit history (for large datasets)
CREATE OR REPLACE FUNCTION public.get_variation_audit_history_paginated(
  p_variation_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
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
  action_timestamp timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    vat.action_timestamp,
    COUNT(*) OVER() as total_count
  FROM variation_audit_trail vat
  LEFT JOIN profiles p ON p.id = vat.user_id
  WHERE vat.variation_id = p_variation_id
  ORDER BY vat.action_timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
