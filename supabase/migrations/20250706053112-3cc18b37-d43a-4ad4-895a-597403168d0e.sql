-- Update inspection type values and add incomplete-draft status
-- No need to update existing data since we're changing the allowed values

-- Update the overall_status to include incomplete-draft
-- (No table alteration needed since it's a text field, just need to update application logic)

-- Note: The inspection_type and overall_status are text fields, so no schema changes needed
-- Application-level validation will handle the new values:
-- - inspection_type: 'pre-installation', 'progress', 'final' (instead of 'post-installation')  
-- - overall_status: 'pass', 'fail', 'pending-reinspection', 'incomplete-in-progress', 'incomplete-draft'

-- This migration serves as a record of the change in allowed values