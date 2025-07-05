-- Add trade column to qa_inspections table
ALTER TABLE public.qa_inspections 
ADD COLUMN trade text;

-- Set default trade for existing records based on template_type
UPDATE public.qa_inspections 
SET trade = CASE 
  WHEN template_type IN ('doors-jambs-hardware', 'skirting') THEN 'carpentry'
  ELSE 'other'
END
WHERE trade IS NULL;

-- Make trade column not null with default
ALTER TABLE public.qa_inspections 
ALTER COLUMN trade SET DEFAULT 'other',
ALTER COLUMN trade SET NOT NULL;