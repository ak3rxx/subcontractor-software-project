
-- Create RLS policies for the existing storage bucket
CREATE POLICY "Users can upload QA inspection files" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'qainspectionfiles');

CREATE POLICY "Users can view QA inspection files" ON storage.objects 
FOR SELECT USING (bucket_id = 'qainspectionfiles');

CREATE POLICY "Users can update QA inspection files" ON storage.objects 
FOR UPDATE USING (bucket_id = 'qainspectionfiles');

CREATE POLICY "Users can delete QA inspection files" ON storage.objects 
FOR DELETE USING (bucket_id = 'qainspectionfiles');
