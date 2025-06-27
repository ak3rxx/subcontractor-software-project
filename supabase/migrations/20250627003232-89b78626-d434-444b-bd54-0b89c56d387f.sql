
-- First, let's update the variation number generation to include project ID
-- We need to get the project identifier and create a proper format

-- Drop the existing function
DROP FUNCTION IF EXISTS public.generate_variation_number(uuid);

-- Create an enhanced version that includes project ID
CREATE OR REPLACE FUNCTION public.generate_variation_number(project_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  counter INTEGER;
  project_number TEXT;
  new_number TEXT;
BEGIN
  -- Get project name or create a numeric identifier from project
  SELECT 
    CASE 
      WHEN name ~ '^[0-9]+' THEN SUBSTRING(name FROM '^[0-9]+')
      ELSE LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0')
    END INTO project_number
  FROM public.projects 
  WHERE id = project_uuid;
  
  -- Fallback if no project found
  IF project_number IS NULL THEN
    project_number := '001';
  END IF;
  
  -- Get the current count of variations for this project and add 1
  SELECT COUNT(*) + 1 INTO counter 
  FROM public.variations 
  WHERE project_id = project_uuid;
  
  -- Format as PROJECT_ID-VAR-NNNN (e.g., 005-VAR-0001)
  new_number := project_number || '-VAR-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$function$;

-- Create storage bucket for variation attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('variation-attachments', 'variation-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist before creating new ones
DROP POLICY IF EXISTS "Users can upload variation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view variation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their variation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their variation attachments" ON storage.objects;

-- Create RLS policies for variation attachments bucket
CREATE POLICY "Users can upload variation attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'variation-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view variation attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'variation-attachments'
);

CREATE POLICY "Users can update their variation attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'variation-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their variation attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'variation-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add linking columns to variations table for cross-module integration
ALTER TABLE public.variations 
ADD COLUMN IF NOT EXISTS linked_programme_milestones jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS linked_finance_impacts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS originating_rfi_id uuid REFERENCES public.rfis(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_variations_project_id ON public.variations(project_id);
CREATE INDEX IF NOT EXISTS idx_variations_originating_rfi ON public.variations(originating_rfi_id);
