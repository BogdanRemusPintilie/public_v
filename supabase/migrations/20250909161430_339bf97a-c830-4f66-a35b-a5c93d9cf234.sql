-- Create storage policies for tranching reports
-- The folder structure is: tranching-reports/{user_id}/{dataset_name}/report.pdf

-- Policy for SELECT (viewing/downloading tranching reports)
CREATE POLICY "Users can view their own tranching reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'investor-reports' 
  AND (storage.foldername(name))[1] = 'tranching-reports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for INSERT (uploading tranching reports)
CREATE POLICY "Users can upload their own tranching reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'investor-reports' 
  AND (storage.foldername(name))[1] = 'tranching-reports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for UPDATE (updating tranching reports)
CREATE POLICY "Users can update their own tranching reports" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'investor-reports' 
  AND (storage.foldername(name))[1] = 'tranching-reports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for DELETE (deleting tranching reports)
CREATE POLICY "Users can delete their own tranching reports" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'investor-reports' 
  AND (storage.foldername(name))[1] = 'tranching-reports'
  AND (storage.foldername(name))[2] = auth.uid()::text
);