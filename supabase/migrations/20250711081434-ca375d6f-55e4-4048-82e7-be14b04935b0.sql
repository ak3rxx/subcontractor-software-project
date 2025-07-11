-- Update status values to standardize "incomplete-in-progress" 
UPDATE qa_inspections 
SET overall_status = 'incomplete-in-progress' 
WHERE overall_status = 'incomplete-draft';

-- Update any variations that might have inconsistent statuses
UPDATE qa_inspections 
SET overall_status = 'incomplete-in-progress' 
WHERE overall_status IN ('in-progress', 'in_progress', 'draft');