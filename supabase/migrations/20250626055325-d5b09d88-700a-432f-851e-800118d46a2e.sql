
-- Create storage bucket for variation attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'variation-attachments',
  'variation-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif']
);

-- Create storage policies for variation attachments
CREATE POLICY "Authenticated users can upload variation attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'variation-attachments');

CREATE POLICY "Users can view variation attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'variation-attachments');

CREATE POLICY "Users can update their variation attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'variation-attachments');

CREATE POLICY "Users can delete their variation attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'variation-attachments');

-- Create variation_attachments table to track file metadata
CREATE TABLE public.variation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id UUID REFERENCES public.variations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on variation_attachments
ALTER TABLE public.variation_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for variation_attachments
CREATE POLICY "Users can view variation attachments"
ON public.variation_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create variation attachments"
ON public.variation_attachments FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their variation attachments"
ON public.variation_attachments FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their variation attachments"
ON public.variation_attachments FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Create variation_edit_history table for audit trail
CREATE TABLE public.variation_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_id UUID REFERENCES public.variations(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES auth.users(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edit_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on variation_edit_history
ALTER TABLE public.variation_edit_history ENABLE ROW LEVEL SECURITY;

-- Create policies for variation_edit_history
CREATE POLICY "Users can view variation edit history"
ON public.variation_edit_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create variation edit history"
ON public.variation_edit_history FOR INSERT
TO authenticated
WITH CHECK (edited_by = auth.uid());

-- Add additional fields to variations table for enhanced tracking
ALTER TABLE public.variations 
ADD COLUMN IF NOT EXISTS requires_eot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_nod BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS eot_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nod_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS linked_milestones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS linked_tasks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS linked_qa_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pdf_generated_by UUID REFERENCES auth.users(id);

-- Function to record variation edits
CREATE OR REPLACE FUNCTION public.record_variation_edit(
  p_variation_id UUID,
  p_field_name TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_edit_reason TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_record_id UUID;
BEGIN
  INSERT INTO public.variation_edit_history (
    variation_id,
    edited_by,
    field_name,
    old_value,
    new_value,
    edit_reason
  ) VALUES (
    p_variation_id,
    auth.uid(),
    p_field_name,
    p_old_value,
    p_new_value,
    p_edit_reason
  )
  RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$$;
