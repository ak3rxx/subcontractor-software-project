import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SimpleUploadedFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
  uploaded: boolean;
  progress: number;
  error?: string;
}

interface UseSimpleFileUploadOptions {
  bucket?: string;
  inspectionId?: string;
  checklistItemId?: string;
}

export const useSimpleFileUpload = (options: UseSimpleFileUploadOptions = {}) => {
  const { bucket = 'qainspectionfiles', inspectionId, checklistItemId } = options;
  const [files, setFiles] = useState<SimpleUploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const generateFilePath = useCallback((file: File): string => {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    
    if (inspectionId && checklistItemId) {
      return `${inspectionId}/${checklistItemId}/${fileName}`;
    } else if (inspectionId) {
      return `${inspectionId}/general/${fileName}`;
    } else {
      return `temp/${fileName}`;
    }
  }, [inspectionId, checklistItemId]);

  const uploadFiles = useCallback(async (newFiles: File[]): Promise<SimpleUploadedFile[]> => {
    if (newFiles.length === 0) return [];
    
    setIsUploading(true);
    const uploadedResults: SimpleUploadedFile[] = [];

    try {
      for (const file of newFiles) {
        const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const filePath = generateFilePath(file);

        // Create initial file object
        const initialFile: SimpleUploadedFile = {
          id: fileId,
          file,
          url: '',
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          uploaded: false,
          progress: 0
        };

        // Add to files immediately with 0% progress
        setFiles(prev => [...prev, initialFile]);

        try {
          // Update progress to show start
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 10 } : f
          ));

          // Upload to Supabase
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          const completedFile: SimpleUploadedFile = {
            ...initialFile,
            url: urlData.publicUrl,
            uploaded: true,
            progress: 100
          };

          // Update file as completed
          setFiles(prev => prev.map(f => 
            f.id === fileId ? completedFile : f
          ));

          uploadedResults.push(completedFile);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          
          // Update file with error
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, error: errorMessage, progress: 0 } : f
          ));

          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}: ${errorMessage}`,
            variant: "destructive"
          });
        }
      }

      if (uploadedResults.length > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${uploadedResults.length} file(s)`
        });
      }

    } finally {
      setIsUploading(false);
    }

    return uploadedResults;
  }, [bucket, generateFilePath, toast]);

  const removeFile = useCallback(async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (!fileToRemove) return;

    // Remove from storage if uploaded
    if (fileToRemove.uploaded && fileToRemove.path) {
      try {
        await supabase.storage.from(bucket).remove([fileToRemove.path]);
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Remove from state
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files, bucket]);

  const retryUpload = useCallback(async (fileId: string) => {
    const failedFile = files.find(f => f.id === fileId && !f.uploaded);
    if (!failedFile) return;

    await uploadFiles([failedFile.file]);
    
    // Remove the failed version
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files, uploadFiles]);

  const clearFiles = useCallback(async () => {
    const uploadedPaths = files
      .filter(f => f.uploaded && f.path)
      .map(f => f.path);

    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage.from(bucket).remove(uploadedPaths);
      } catch (error) {
        console.error('Failed to clear files from storage:', error);
      }
    }

    setFiles([]);
  }, [files, bucket]);

  return {
    files,
    isUploading,
    uploadFiles,
    removeFile,
    retryUpload,
    clearFiles,
    hasFailures: files.some(f => !f.uploaded && f.error),
    completedFiles: files.filter(f => f.uploaded),
    failedFiles: files.filter(f => !f.uploaded && f.error)
  };
};