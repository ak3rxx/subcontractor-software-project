-- Enhance database trigger to ensure all draft changes trigger audit trail
-- This ensures comprehensive audit logging for all variation changes

-- First, let's check if the trigger needs enhancement
CREATE OR REPLACE FUNCTION public.log_variation_comprehensive_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_uuid UUID;
  cost_breakdown_summary TEXT;
  old_total NUMERIC;
  new_total NUMERIC;
  change_timestamp TIMESTAMP WITH TIME ZONE;
  duplicate_check INTEGER;
BEGIN
  -- Get current user ID with fallbacks
  user_uuid := COALESCE(auth.uid(), NEW.updated_by, OLD.updated_by);
  
  -- Skip if no valid user (prevents system errors)
  IF user_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use a specific timestamp for this batch of changes
  change_timestamp := NOW();

  -- Status changes (always log these)
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check for duplicates first
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND status_from = OLD.status 
      AND status_to = NEW.status
      AND action_timestamp > change_timestamp - INTERVAL '5 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, status_from, status_to, 
        comments, metadata, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 
        CASE 
          WHEN NEW.status = 'pending_approval' THEN 'submit'
          WHEN NEW.status = 'approved' THEN 'approve'
          WHEN NEW.status = 'rejected' THEN 'reject'
          WHEN NEW.status = 'draft' AND OLD.status IN ('approved', 'rejected') THEN 'unlock'
          ELSE 'status_change'
        END,
        OLD.status, NEW.status, 
        NEW.approval_comments,
        jsonb_build_object(
          'approved_by', NEW.approved_by,
          'approval_date', NEW.approval_date,
          'request_date', NEW.request_date,
          'variation_number', NEW.variation_number
        ),
        change_timestamp
      );
    END IF;
  END IF;

  -- Individual field changes (log these regardless of status)
  -- Title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'title'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'title', OLD.title, NEW.title, change_timestamp
      );
    END IF;
  END IF;

  -- Description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'description'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'description', 
        LEFT(COALESCE(OLD.description, ''), 100), 
        LEFT(COALESCE(NEW.description, ''), 100), 
        change_timestamp
      );
    END IF;
  END IF;

  -- Cost impact changes
  IF OLD.cost_impact IS DISTINCT FROM NEW.cost_impact THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'cost_impact'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'cost_impact', 
        COALESCE(OLD.cost_impact::TEXT, '0'), 
        COALESCE(NEW.cost_impact::TEXT, '0'), 
        change_timestamp
      );
    END IF;
  END IF;

  -- GST amount changes
  IF OLD.gst_amount IS DISTINCT FROM NEW.gst_amount THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'gst_amount'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'gst_amount', 
        COALESCE(OLD.gst_amount::TEXT, '0'), 
        COALESCE(NEW.gst_amount::TEXT, '0'), 
        change_timestamp
      );
    END IF;
  END IF;

  -- Total amount changes
  IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'total_amount'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'total_amount', 
        COALESCE(OLD.total_amount::TEXT, '0'), 
        COALESCE(NEW.total_amount::TEXT, '0'), 
        change_timestamp
      );
    END IF;
  END IF;

  -- Continue with other fields (priority, category, trade, location, etc.)
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'priority'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'priority', OLD.priority, NEW.priority, change_timestamp
      );
    END IF;
  END IF;

  -- Category changes
  IF OLD.category IS DISTINCT FROM NEW.category THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'category'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'category', OLD.category, NEW.category, change_timestamp
      );
    END IF;
  END IF;

  -- Trade changes
  IF OLD.trade IS DISTINCT FROM NEW.trade THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'trade'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'trade', OLD.trade, NEW.trade, change_timestamp
      );
    END IF;
  END IF;

  -- Location changes
  IF OLD.location IS DISTINCT FROM NEW.location THEN
    SELECT COUNT(*) INTO duplicate_check
    FROM variation_audit_trail 
    WHERE variation_id = NEW.id 
      AND field_name = 'location'
      AND action_timestamp > change_timestamp - INTERVAL '2 seconds'
      AND user_id = user_uuid;
      
    IF duplicate_check = 0 THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'location', OLD.location, NEW.location, change_timestamp
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;