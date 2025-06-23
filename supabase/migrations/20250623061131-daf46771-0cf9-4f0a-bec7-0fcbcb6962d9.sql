
-- Remove the foreign key constraint for organization_id
ALTER TABLE public.qa_inspections 
DROP CONSTRAINT qa_inspections_organization_id_fkey;

-- Make organization_id nullable for development
ALTER TABLE public.qa_inspections 
ALTER COLUMN organization_id DROP NOT NULL;
