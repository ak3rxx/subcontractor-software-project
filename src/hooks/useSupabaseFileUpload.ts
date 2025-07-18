
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedQANotifications } from '@/hooks/useEnhancedQANotifications';

export interface SupabaseUploadedFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
  uploaded: boolean;
  error?: string;
}

interface UseSupabaseFileUploadOptions {
  bucket?: string;
  folder?: string;
}

export const useSupabaseFileUpload = (options: UseSupabaseFileUploadOptions = {}) => {
  const { bucket = 'qainspectionfiles', folder } = options;
  const [uploadedFiles, setUploadedFiles] = useState<SupabaseUploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasUploadFailures, setHasUploadFailures] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const qaNotifications = useEnhancedQANotifications();

  const uploadFile = useCallback(async (
    file: File, 
    inspectionId?: string, 
    checklistItemId?: string
  ): Promise<SupabaseUploadedFile | null> => {
    if (!user) {
      qaNotifications.notifyUploadError(file.name, 'Authentication required. Please log in to upload files.');
      return null;
    }

    setUploading(true);
    
    // Add to upload queue for progress tracking
    const fileId = `${file.name}-${Date.now()}`;
    setUploadQueue(prev => [...prev, fileId]);
    
    // Notify upload start
    qaNotifications.notifyUploadStart(file.name, 1, 1);
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    let filePath: string;
    if (bucket === 'variation-attachments') {
      // For variation attachments, organize by user ID and timestamp
      filePath = folder ? `${folder}/${fileName}` : `${user.id}/${fileName}`;
    } else {
      // For QA inspections, use the original structure
      filePath = inspectionId && checklistItemId 
        ? `${inspectionId}/${checklistItemId}/${fileName}`
        : `temp/${fileName}`;
    }

    try {
      console.log(`Uploading file to bucket: ${bucket}, path:`, filePath);
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);

      const uploadedFile: SupabaseUploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        uploaded: true
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      
      // Remove from upload queue
      setUploadQueue(prev => prev.filter(id => id !== fileId));
      
      // Notify successful upload
      qaNotifications.notifyUploadSuccess(file.name, urlData.publicUrl);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`
      });

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      const failedFile: SupabaseUploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: '',
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        uploaded: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };

      setUploadedFiles(prev => [...prev, failedFile]);
      setHasUploadFailures(true);
      
      // Remove from upload queue
      setUploadQueue(prev => prev.filter(id => id !== fileId));
      
      // Notify upload error with enhanced details
      qaNotifications.notifyUploadError(file.name, error instanceof Error ? error.message : 'Upload failed');
      
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast, bucket, folder]);

  const uploadFiles = useCallback(async (
    files: File[], 
    inspectionId?: string, 
    checklistItemId?: string
  ): Promise<SupabaseUploadedFile[]> => {
    // Notify start of batch upload
    qaNotifications.notifyUploadStart(
      `${files.length} files`, 
      0, 
      files.length
    );
    
    // Process files in parallel with concurrency limit
    const maxConcurrency = 3;
    const results: SupabaseUploadedFile[] = [];
    const failedFiles: string[] = [];
    
    // Split files into chunks for parallel processing
    const processChunk = async (fileChunk: File[], chunkIndex: number) => {
      const uploadPromises = fileChunk.map(async (file, index) => {
        const globalIndex = chunkIndex * maxConcurrency + index;
        
        // Update progress notification
        qaNotifications.notifyUploadProgress(file.name, globalIndex + 1, files.length);
        
        // Retry logic with exponential backoff
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount <= maxRetries) {
          try {
            const result = await uploadFile(file, inspectionId, checklistItemId);
            if (result) {
              return { success: true, result, fileName: file.name };
            } else {
              if (retryCount === maxRetries) {
                return { success: false, result: null, fileName: file.name };
              }
              retryCount++;
              // Exponential backoff: 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          } catch (error) {
            console.error(`Failed to upload ${file.name} (attempt ${retryCount + 1}):`, error);
            if (retryCount === maxRetries) {
              return { success: false, result: null, fileName: file.name };
            }
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          }
        }
        
        return { success: false, result: null, fileName: file.name };
      });
      
      return Promise.all(uploadPromises);
    };
    
    // Process files in chunks
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const chunk = files.slice(i, i + maxConcurrency);
      const chunkResults = await processChunk(chunk, Math.floor(i / maxConcurrency));
      
      chunkResults.forEach(({ success, result, fileName }) => {
        if (success && result) {
          results.push(result);
        } else {
          failedFiles.push(fileName);
        }
      });
    }
    
    // Notify completion with summary
    qaNotifications.notifyUploadQueueComplete(files.length, failedFiles.length);
    
    return results;
  }, [uploadFile, qaNotifications]);

  const removeFile = useCallback(async (fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (fileToRemove && fileToRemove.uploaded) {
      try {
        console.log('Deleting file from storage:', fileToRemove.path);
        // Delete from Supabase Storage
        const { error } = await supabase.storage
          .from(bucket)
          .remove([fileToRemove.path]);

        if (error) {
          console.error('Error deleting file from storage:', error);
          toast({
            title: "Delete failed",
            description: "Failed to delete file from storage.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Update failure status
      const hasFailures = updated.some(f => !f.uploaded);
      setHasUploadFailures(hasFailures);
      return updated;
    });
  }, [uploadedFiles, toast, bucket]);

  const retryFailedUpload = useCallback(async (
    fileId: string, 
    inspectionId?: string, 
    checklistItemId?: string
  ) => {
    const failedFile = uploadedFiles.find(f => f.id === fileId && !f.uploaded);
    if (!failedFile) return;

    // Remove the failed file entry
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Retry upload
    await uploadFile(failedFile.file, inspectionId, checklistItemId);
  }, [uploadedFiles, uploadFile]);

  const clearFiles = useCallback(async () => {
    // Delete uploaded files from storage
    const uploadedFilePaths = uploadedFiles
      .filter(file => file.uploaded)
      .map(file => file.path);

    if (uploadedFilePaths.length > 0) {
      try {
        console.log('Clearing files from storage:', uploadedFilePaths);
        const { error } = await supabase.storage
          .from(bucket)
          .remove(uploadedFilePaths);

        if (error) {
          console.error('Error deleting files from storage:', error);
        }
      } catch (error) {
        console.error('Error clearing files:', error);
      }
    }

    setUploadedFiles([]);
    setHasUploadFailures(false);
  }, [uploadedFiles, bucket]);

  return {
    uploadedFiles,
    uploading,
    hasUploadFailures,
    uploadQueue,
    uploadFile,
    uploadFiles,
    removeFile,
    retryFailedUpload,
    clearFiles
  };
};
