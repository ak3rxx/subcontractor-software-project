
-- Create storage bucket for variation attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'variation-attachments',
  'variation-attachments',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive storage policies for variation attachments
CREATE POLICY "Allow authenticated users to upload variation attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'variation-attachments');

CREATE POLICY "Allow authenticated users to view variation attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'variation-attachments');

CREATE POLICY "Allow authenticated users to update variation attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'variation-attachments');

CREATE POLICY "Allow authenticated users to delete variation attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'variation-attachments');

-- Ensure variation_attachments table has proper policies for developers
DROP POLICY IF EXISTS "Developers can manage all variation attachments" ON public.variation_attachments;
CREATE POLICY "Developers can manage all variation attachments"
ON public.variation_attachments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_developer = true
  )
);

-- Add developer-friendly policies for variations table
DROP POLICY IF EXISTS "Developers can manage all variations" ON public.variations;
CREATE POLICY "Developers can manage all variations"
ON public.variations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_developer = true
  )
);
