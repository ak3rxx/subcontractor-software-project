-- Fix QA inspection constraints by updating existing data first

-- Update existing 'post-installation' records to 'pre-installation'
UPDATE public.qa_inspections 
SET inspection_type = 'pre-installation' 
WHERE inspection_type = 'post-installation';

-- Drop and recreate the inspection_type constraint with correct values
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT IF EXISTS qa_inspections_inspection_type_check;

ALTER TABLE public.qa_inspections 
ADD CONSTRAINT qa_inspections_inspection_type_check 
CHECK (inspection_type IN ('pre-installation', 'progress', 'final'));

-- Update the overall_status constraint to include new status values
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT IF EXISTS qa_inspections_overall_status_check;

ALTER TABLE public.qa_inspections 
ADD CONSTRAINT qa_inspections_overall_status_check 
CHECK (overall_status IN ('pass', 'fail', 'pending-reinspection', 'incomplete-in-progress', 'incomplete-draft'));