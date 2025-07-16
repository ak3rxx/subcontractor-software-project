-- Fix race condition in QA inspection number generation by using atomic operations

-- First, add a unique constraint to prevent duplicate inspection numbers within a project
ALTER TABLE public.qa_inspections 
ADD CONSTRAINT unique_inspection_number_per_project 
UNIQUE (project_id, inspection_number);

-- Create atomic QA inspection number generation function with proper locking
CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number_atomic(project_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  counter INTEGER;
  proj_number INTEGER;
  new_number TEXT;
  max_attempts INTEGER := 10;
  current_attempt INTEGER := 0;
BEGIN
  -- Get project number with row lock to prevent race conditions
  SELECT project_number INTO proj_number
  FROM public.projects 
  WHERE id = project_uuid
  FOR UPDATE;
  
  -- Fallback if no project found
  IF proj_number IS NULL THEN
    proj_number := 1;
  END IF;
  
  -- Loop to handle potential race conditions with retry logic
  LOOP
    current_attempt := current_attempt + 1;
    
    -- Get the current maximum sequence number for this project
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
    
    -- Format as PROJECT_NUMBER-QA-NNNN (e.g., 001-QA-0001)
    new_number := LPAD(proj_number::TEXT, 3, '0') || '-QA-' || LPAD(counter::TEXT, 4, '0');
    
    -- Check if this number already exists (additional safety check)
    IF NOT EXISTS (
      SELECT 1 FROM public.qa_inspections 
      WHERE project_id = project_uuid 
      AND inspection_number = new_number
    ) THEN
      -- Number is unique, we can use it
      EXIT;
    END IF;
    
    -- If we've tried too many times, something is wrong
    IF current_attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique QA inspection number after % attempts', max_attempts;
    END IF;
    
    -- Add small delay to reduce contention
    PERFORM pg_sleep(0.01);
  END LOOP;
  
  RETURN new_number;
END;
$$;

-- Create a more robust backup function that uses sequences for absolute atomicity
CREATE SEQUENCE IF NOT EXISTS qa_inspection_global_sequence;

CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number_sequence(project_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  proj_number INTEGER;
  sequence_num INTEGER;
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
  
  -- Get next sequence number (absolutely atomic)
  sequence_num := nextval('qa_inspection_global_sequence');
  
  -- Format as PROJECT_NUMBER-QA-NNNN using global sequence
  new_number := LPAD(proj_number::TEXT, 3, '0') || '-QA-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Update the main function to use the atomic version
CREATE OR REPLACE FUNCTION public.generate_qa_inspection_number(project_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use the atomic version for better reliability
  RETURN generate_qa_inspection_number_atomic(project_uuid);
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to sequence-based generation if atomic version fails
    RETURN generate_qa_inspection_number_sequence(project_uuid);
END;
$$;