
-- Drop existing trigger to recreate with comprehensive tracking
DROP TRIGGER IF EXISTS variation_status_change_trigger ON public.variations;
DROP TRIGGER IF EXISTS variation_comprehensive_changes_trigger ON public.variations;

-- Enhanced comprehensive trigger function for all variation field changes
CREATE OR REPLACE FUNCTION public.log_variation_comprehensive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  cost_breakdown_summary TEXT;
  old_total NUMERIC;
  new_total NUMERIC;
BEGIN
  -- Get current user ID with fallbacks
  user_uuid := COALESCE(auth.uid(), NEW.updated_by, OLD.updated_by);
  
  -- Skip if no valid user (prevents system errors)
  IF user_uuid IS NULL THEN
    RETURN NEW;
  END IF;

  -- Status changes (highest priority - log first)
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO variation_audit_trail (
      variation_id, user_id, action_type, status_from, status_to, 
      comments, metadata, action_timestamp
    ) 
    SELECT 
      NEW.id, user_uuid, 
      CASE 
        WHEN NEW.status = 'pending_approval' THEN 'submit'
        WHEN NEW.status = 'approved' THEN 'approve'
        WHEN NEW.status = 'rejected' THEN 'reject'
        WHEN NEW.status = 'draft' AND OLD.status IN ('approved', 'rejected') THEN 'unlock'
        ELSE 'edit'
      END,
      OLD.status, NEW.status, 
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
        AND action_timestamp > NOW() - INTERVAL '2 seconds'
        AND user_id = user_uuid
    );
  END IF;

  -- Individual field changes (only log if not a status change to avoid noise)
  IF OLD.status = NEW.status OR OLD.status IS NULL THEN
    
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

    -- GST amount changes
    IF OLD.gst_amount IS DISTINCT FROM NEW.gst_amount THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'gst_amount', 
        COALESCE(OLD.gst_amount::TEXT, '0'), 
        COALESCE(NEW.gst_amount::TEXT, '0'), 
        NOW()
      );
    END IF;

    -- Total amount changes
    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'total_amount', 
        COALESCE(OLD.total_amount::TEXT, '0'), 
        COALESCE(NEW.total_amount::TEXT, '0'), 
        NOW()
      );
    END IF;

    -- Cost breakdown changes (JSONB with intelligent summary)
    IF OLD.cost_breakdown IS DISTINCT FROM NEW.cost_breakdown THEN
      -- Calculate totals for summary
      SELECT COALESCE(SUM((item->>'subtotal')::NUMERIC), 0) INTO old_total
      FROM jsonb_array_elements(COALESCE(OLD.cost_breakdown, '[]'::jsonb)) AS item;
      
      SELECT COALESCE(SUM((item->>'subtotal')::NUMERIC), 0) INTO new_total
      FROM jsonb_array_elements(COALESCE(NEW.cost_breakdown, '[]'::jsonb)) AS item;

      cost_breakdown_summary := 'Cost breakdown updated: ' || 
        jsonb_array_length(COALESCE(OLD.cost_breakdown, '[]'::jsonb)) || ' → ' ||
        jsonb_array_length(COALESCE(NEW.cost_breakdown, '[]'::jsonb)) || ' items, ' ||
        'Total: $' || old_total || ' → $' || new_total;

      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, 
        comments, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'cost_breakdown', 
        'Items: ' || jsonb_array_length(COALESCE(OLD.cost_breakdown, '[]'::jsonb)),
        'Items: ' || jsonb_array_length(COALESCE(NEW.cost_breakdown, '[]'::jsonb)),
        cost_breakdown_summary,
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

    -- EOT requirements and days
    IF OLD.requires_eot IS DISTINCT FROM NEW.requires_eot THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'requires_eot', 
        COALESCE(OLD.requires_eot::TEXT, 'false'), 
        COALESCE(NEW.requires_eot::TEXT, 'false'), 
        NOW()
      );
    END IF;

    IF OLD.eot_days IS DISTINCT FROM NEW.eot_days THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'eot_days', 
        COALESCE(OLD.eot_days::TEXT, '0'), 
        COALESCE(NEW.eot_days::TEXT, '0'), 
        NOW()
      );
    END IF;

    -- NOD requirements and days
    IF OLD.requires_nod IS DISTINCT FROM NEW.requires_nod THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'requires_nod', 
        COALESCE(OLD.requires_nod::TEXT, 'false'), 
        COALESCE(NEW.requires_nod::TEXT, 'false'), 
        NOW()
      );
    END IF;

    IF OLD.nod_days IS DISTINCT FROM NEW.nod_days THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'nod_days', 
        COALESCE(OLD.nod_days::TEXT, '0'), 
        COALESCE(NEW.nod_days::TEXT, '0'), 
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

    -- Location changes
    IF OLD.location IS DISTINCT FROM NEW.location THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'location', OLD.location, NEW.location, NOW()
      );
    END IF;

    -- Justification changes
    IF OLD.justification IS DISTINCT FROM NEW.justification THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'justification', 
        LEFT(COALESCE(OLD.justification, ''), 100), 
        LEFT(COALESCE(NEW.justification, ''), 100), 
        NOW()
      );
    END IF;

    -- Client email changes
    IF OLD.client_email IS DISTINCT FROM NEW.client_email THEN
      INSERT INTO variation_audit_trail (
        variation_id, user_id, action_type, field_name, old_value, new_value, action_timestamp
      ) VALUES (
        NEW.id, user_uuid, 'edit', 'client_email', OLD.client_email, NEW.client_email, NOW()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Create the comprehensive trigger
CREATE TRIGGER variation_comprehensive_changes_trigger
  AFTER UPDATE ON public.variations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_variation_comprehensive_changes();

-- Create trigger function for variation attachments
CREATE OR REPLACE FUNCTION public.log_variation_attachment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  action_type_val TEXT;
  file_action TEXT;
BEGIN
  user_uuid := COALESCE(auth.uid(), NEW.uploaded_by, OLD.uploaded_by);
  
  IF user_uuid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type_val := 'file_upload';
    file_action := 'File uploaded: ' || NEW.file_name;
  ELSIF TG_OP = 'DELETE' THEN
    action_type_val := 'file_delete';
    file_action := 'File deleted: ' || OLD.file_name;
  ELSE
    action_type_val := 'file_update';
    file_action := 'File updated: ' || NEW.file_name;
  END IF;

  -- Log to variation audit trail
  INSERT INTO variation_audit_trail (
    variation_id, user_id, action_type, field_name, 
    new_value, comments, metadata, action_timestamp
  ) VALUES (
    COALESCE(NEW.variation_id, OLD.variation_id),
    user_uuid,
    action_type_val,
    'attachment',
    COALESCE(NEW.file_name, OLD.file_name),
    file_action,
    jsonb_build_object(
      'file_size', COALESCE(NEW.file_size, OLD.file_size),
      'file_type', COALESCE(NEW.file_type, OLD.file_type),
      'file_path', COALESCE(NEW.file_path, OLD.file_path)
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for variation attachments
CREATE TRIGGER variation_attachment_insert_trigger
  AFTER INSERT ON public.variation_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_variation_attachment_changes();

CREATE TRIGGER variation_attachment_delete_trigger
  AFTER DELETE ON public.variation_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_variation_attachment_changes();

-- Update audit trail action types to include file operations
ALTER TABLE public.variation_audit_trail 
DROP CONSTRAINT IF EXISTS variation_audit_trail_action_type_check;

ALTER TABLE public.variation_audit_trail 
ADD CONSTRAINT variation_audit_trail_action_type_check 
CHECK (action_type IN ('create', 'edit', 'submit', 'approve', 'reject', 'unlock', 'email_sent', 'file_upload', 'file_delete', 'file_update'));

-- Create index for better performance on file-related queries
CREATE INDEX IF NOT EXISTS idx_variation_audit_trail_file_actions 
ON variation_audit_trail(variation_id, action_type) 
WHERE action_type IN ('file_upload', 'file_delete', 'file_update');
