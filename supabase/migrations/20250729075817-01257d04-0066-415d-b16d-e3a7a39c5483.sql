-- Create storage policies for taskfiles bucket to allow authenticated users to upload files

-- Allow authenticated users to upload files to tasks/ path
CREATE POLICY "Authenticated users can upload task files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'taskfiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tasks'
);

-- Allow authenticated users to view task files
CREATE POLICY "Authenticated users can view task files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'taskfiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tasks'
);

-- Allow authenticated users to update task files
CREATE POLICY "Authenticated users can update task files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'taskfiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tasks'
);

-- Allow authenticated users to delete task files
CREATE POLICY "Authenticated users can delete task files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'taskfiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tasks'
);