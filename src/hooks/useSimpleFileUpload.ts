
import { useState, useCallback, useRef } from 'react';
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
  
  // Enhanced upload tracking with content-based deduplication
  const uploadsInProgress = useRef<Set<string>>(new Set());
  const processedFiles = useRef<Map<string, SimpleUploadedFile>>(new Map());

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

  // Enhanced file identity function
  const getFileIdentity = useCallback((file: File): string => {
    // Create a more robust identity key based on content characteristics
    return `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  }, []);

  const uploadFiles = useCallback(async (newFiles: File[]): Promise<SimpleUploadedFile[]> => {
    if (newFiles.length === 0) return [];
    
    console.log('Upload request for', newFiles.length, 'files');
    setIsUploading(true);
    const uploadedResults: SimpleUploadedFile[] = [];

    try {
      for (const file of newFiles) {
        const fileIdentity = getFileIdentity(file);
        
        // Check if this exact file is already processed
        if (processedFiles.current.has(fileIdentity)) {
          console.log('File already processed, skipping:', file.name);
          const existingFile = processedFiles.current.get(fileIdentity)!;
          uploadedResults.push(existingFile);
          continue;
        }
        
        // Check if upload is already in progress
        if (uploadsInProgress.current.has(fileIdentity)) {
          console.log('Upload already in progress for:', file.name);
          continue;
        }
        
        uploadsInProgress.current.add(fileIdentity);
        
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
        setFiles(prev => {
          // Prevent duplicate entries in state
          const exists = prev.some(f => f.id === fileId);
          if (exists) return prev;
          return [...prev, initialFile];
        });

        try {
          // Update progress to show start
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 10 } : f
          ));

          console.log('Starting upload for:', file.name);
          
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

          // Cache the processed file
          processedFiles.current.set(fileIdentity, completedFile);
          uploadedResults.push(completedFile);

          console.log('Upload completed for:', file.name);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          console.error('Upload failed for:', file.name, errorMessage);
          
          // Update file with error
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, error: errorMessage, progress: 0 } : f
          ));

          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}: ${errorMessage}`,
            variant: "destructive"
          });
        } finally {
          // Remove from uploads in progress
          uploadsInProgress.current.delete(fileIdentity);
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
  }, [bucket, generateFilePath, toast, getFileIdentity]);

  const removeFile = useCallback(async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (!fileToRemove) return;

    console.log('Removing file:', fileToRemove.name);

    // Remove from storage if uploaded
    if (fileToRemove.uploaded && fileToRemove.path) {
      try {
        await supabase.storage.from(bucket).remove([fileToRemove.path]);
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Remove from processed cache
    const fileIdentity = getFileIdentity(fileToRemove.file);
    processedFiles.current.delete(fileIdentity);

    // Remove from state
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files, bucket, getFileIdentity]);

  const retryUpload = useCallback(async (fileId: string) => {
    const failedFile = files.find(f => f.id === fileId && !f.uploaded);
    if (!failedFile) return;

    console.log('Retrying upload for:', failedFile.name);
    
    // Remove the failed version first
    setFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Retry the upload
    await uploadFiles([failedFile.file]);
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
    uploadsInProgress.current.clear();
    processedFiles.current.clear();
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
