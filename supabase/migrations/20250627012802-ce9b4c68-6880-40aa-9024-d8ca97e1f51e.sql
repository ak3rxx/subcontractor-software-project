
-- Add project_number field to projects table
ALTER TABLE public.projects 
ADD COLUMN project_number INTEGER;

-- Create function to generate sequential project numbers per organization
CREATE OR REPLACE FUNCTION public.generate_project_number(org_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- If no organization provided, use a default approach
  IF org_id IS NULL THEN
    SELECT COALESCE(MAX(project_number), 0) + 1 INTO next_number 
    FROM public.projects 
    WHERE organization_id IS NULL;
  ELSE
    -- Get next number for the organization
    SELECT COALESCE(MAX(project_number), 0) + 1 INTO next_number 
    FROM public.projects 
    WHERE organization_id = org_id;
  END IF;
  
  RETURN next_number;
END;
$$;

-- Update existing projects to have project numbers
UPDATE public.projects 
SET project_number = generate_project_number(organization_id)
WHERE project_number IS NULL;

-- Make project_number NOT NULL after populating existing records
ALTER TABLE public.projects 
ALTER COLUMN project_number SET NOT NULL;

-- Update variation number generation to use project numbers
CREATE OR REPLACE FUNCTION public.generate_variation_number(project_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  proj_number INTEGER;
  new_number TEXT;
BEGIN
  -- Get project number
  SELECT project_number INTO proj_number
  FROM public.projects 
  WHERE id = project_uuid;
  
  -- Fallback if no project found
  IF proj_number IS NULL THEN
    proj_number := 1;
  END IF;
  
  -- Get the current count of variations for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.variations 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-VAR-NNNN (e.g., 001-VAR-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-VAR-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Add trade field to programme_milestones table
ALTER TABLE public.programme_milestones 
ADD COLUMN trade TEXT,
ADD COLUMN reference_number TEXT;

-- Add reference fields to other tables for cross-linking
ALTER TABLE public.tasks 
ADD COLUMN reference_number TEXT;

ALTER TABLE public.rfis 
ADD COLUMN reference_number TEXT;

-- Add reference tracking to budget_items for finance module
ALTER TABLE public.budget_items 
ADD COLUMN reference_number TEXT,
ADD COLUMN originating_variation_id UUID;
