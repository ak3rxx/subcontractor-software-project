-- Optimize the generate_qa_inspection_number function with timeout controls
CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number_atomic(project_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET statement_timeout = '15s'  -- Add timeout control
AS $function$
DECLARE
  counter INTEGER;
  proj_number INTEGER;
  new_number TEXT;
  max_attempts INTEGER := 5;  -- Reduced from 10
  current_attempt INTEGER := 0;
BEGIN
  -- Get project number with minimal lock time
  SELECT project_number INTO proj_number
  FROM public.projects 
  WHERE id = project_uuid
  FOR UPDATE NOWAIT;  -- Use NOWAIT to prevent blocking
  
  -- Fallback if no project found
  IF proj_number IS NULL THEN
    proj_number := 1;
  END IF;
  
  -- Reduced retry loop with faster execution
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Get the current maximum sequence number for this project (optimized)
    SELECT COALESCE(
      MAX(
        CASE 
          WHEN inspection_number ~ '^[0-9]{3}-QA-[0-9]{4}$' 
          THEN CAST(RIGHT(inspection_number, 4) AS INTEGER)
          ELSE 0
        END
      ), 
      0
    ) + 1 INTO counter
    FROM public.qa_inspections 
    WHERE project_id = project_uuid;
    
    -- Format number
    new_number := LPAD(proj_number::TEXT, 3, '0') || '-QA-' || LPAD(counter::TEXT, 4, '0');
    
    -- Quick uniqueness check
    IF NOT EXISTS (
      SELECT 1 FROM public.qa_inspections 
      WHERE project_id = project_uuid 
      AND inspection_number = new_number
    ) THEN
      EXIT;  -- Number is unique
    END IF;
    
    -- Reduced max attempts and delay
    IF current_attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique QA inspection number after % attempts', max_attempts;
    END IF;
    
    -- Minimal delay
    PERFORM pg_sleep(0.005);  -- 5ms instead of 10ms
  END LOOP;
  
  RETURN new_number;
EXCEPTION
  WHEN lock_not_available THEN
    -- Fallback to sequence-based if can't get lock
    RETURN generate_qa_inspection_number_sequence(project_uuid);
  WHEN OTHERS THEN
    -- Any other error, use sequence fallback
    RETURN generate_qa_inspection_number_sequence(project_uuid);
END;
$function$;