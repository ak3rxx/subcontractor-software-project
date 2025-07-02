-- Update QA inspection number generation to use YYYY format like variations
CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number(project_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  counter INTEGER;
  proj_number INTEGER;
  current_year TEXT;
  new_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get project number
  SELECT project_number INTO proj_number
  FROM public.projects 
  WHERE id = project_uuid;
  
  -- Fallback if no project found
  IF proj_number IS NULL THEN
    proj_number := 1;
  END IF;
  
  -- Get the current count of QA inspections for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.qa_inspections 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-YYYY-NNNN (e.g., 002-2025-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-' || current_year || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$