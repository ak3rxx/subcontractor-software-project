
-- Fix variation approval workflow - prevent duplicate audit entries and improve consistency

-- Drop existing trigger to recreate it properly
DROP TRIGGER IF EXISTS variation_status_change_trigger ON public.variations;

-- Recreate the trigger function with better logic to prevent duplicates
CREATE OR REPLACE FUNCTION public.log_variation_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only log if status actually changed and avoid duplicate entries
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check if an entry already exists for this change to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM variation_audit_trail 
      WHERE variation_id = NEW.id 
        AND status_from = OLD.status 
        AND status_to = NEW.status
        AND action_timestamp > NOW() - INTERVAL '1 minute'
    ) THEN
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
        COALESCE(auth.uid(), NEW.updated_by, OLD.updated_by),
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
          'request_date', NEW.request_date,
          'variation_number', NEW.variation_number
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER variation_status_change_trigger
  AFTER UPDATE ON public.variations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_variation_status_change();

-- Add an updated_by column to track who made the last update
ALTER TABLE public.variations 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id);

-- Clean up any duplicate audit entries (keep the most recent one for each status change)
DELETE FROM variation_audit_trail 
WHERE id NOT IN (
  SELECT DISTINCT ON (variation_id, status_from, status_to) id
  FROM variation_audit_trail 
  ORDER BY variation_id, status_from, status_to, action_timestamp DESC
);
