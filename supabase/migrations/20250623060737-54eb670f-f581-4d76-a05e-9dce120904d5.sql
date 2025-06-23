
-- Update the check constraint to include 'incomplete-in-progress' as a valid status
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT qa_inspections_overall_status_check;

ALTER TABLE public.qa_inspections 
ADD CONSTRAINT qa_inspections_overall_status_check 
CHECK (overall_status IN ('pass', 'fail', 'pending-reinspection', 'incomplete-in-progress'));
