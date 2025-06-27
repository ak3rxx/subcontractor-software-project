
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = useCallback(async (
    file: File, 
    inspectionId?: string, 
    checklistItemId?: string
  ): Promise<SupabaseUploadedFile | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    
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
    const results = await Promise.all(files.map(file => uploadFile(file, inspectionId, checklistItemId)));
    return results.filter((file): file is SupabaseUploadedFile => file !== null);
  }, [uploadFile]);

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
    uploadFile,
    uploadFiles,
    removeFile,
    retryFailedUpload,
    clearFiles
  };
};
