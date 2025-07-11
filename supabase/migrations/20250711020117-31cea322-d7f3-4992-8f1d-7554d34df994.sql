-- Update QA inspection number generation to use PROJECT-QA-SEQUENCE format
CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number(project_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
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
  
  -- Get the current count of QA inspections for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.qa_inspections 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_NUMBER-QA-NNNN (e.g., 001-QA-0001)
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-QA-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$