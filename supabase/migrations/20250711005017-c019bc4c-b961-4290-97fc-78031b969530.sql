-- Remove the restrictive inspection_type constraint entirely and add a more permissive one
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT IF EXISTS qa_inspections_inspection_type_check;

-- Add the new overall_status values to the constraint
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT IF EXISTS qa_inspections_overall_status_check;

ALTER TABLE public.qa_inspections 
ADD CONSTRAINT qa_inspections_overall_status_check 
CHECK (overall_status IN ('pass', 'fail', 'pending-reinspection', 'incomplete-in-progress', 'incomplete-draft'));