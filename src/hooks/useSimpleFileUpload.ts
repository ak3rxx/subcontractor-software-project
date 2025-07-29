
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
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const { toast } = useToast();
  
  // Enhanced upload tracking with mobile optimization
  const uploadsInProgress = useRef<Set<string>>(new Set());
  const processedFiles = useRef<Map<string, SimpleUploadedFile>>(new Map());
  const isMobile = useRef(typeof window !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
  const maxConcurrentUploads = useRef(isMobile.current ? 2 : 4);
  const uploadPromises = useRef<Map<string, Promise<any>>>(new Map());

  const generateFilePath = useCallback((file: File): string => {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    
    // Simplified path structure for tasks - remove dependency on projectId
    if (inspectionId) {
      return `tasks/${inspectionId}/${fileName}`;
    } else {
      return `tasks/temp/${fileName}`;
    }
  }, [inspectionId]);

  // Enhanced file identity function
  const getFileIdentity = useCallback((file: File): string => {
    // Create a more robust identity key based on content characteristics
    return `${file.name}-${file.size}-${file.type}-${file.lastModified}`;
  }, []);

  // Mobile-optimized compression function
  const compressImageIfNeeded = useCallback(async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size < 1024 * 1024) return file; // Skip compression for non-images or files < 1MB
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxDimension = isMobile.current ? 1920 : 2560;
        const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
        
        if (ratio >= 1) {
          resolve(file); // No compression needed
          return;
        }
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, { type: file.type });
            console.log(`Compressed ${file.name} from ${file.size} to ${compressedFile.size} bytes`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Batch processing for mobile optimization
  const processBatch = useCallback(async (batch: File[]): Promise<SimpleUploadedFile[]> => {
    const batchResults: SimpleUploadedFile[] = [];
    
    for (const file of batch) {
      const fileIdentity = getFileIdentity(file);
      
      // Check if already processed
      if (processedFiles.current.has(fileIdentity)) {
        const existingFile = processedFiles.current.get(fileIdentity)!;
        batchResults.push(existingFile);
        continue;
      }
      
      // Check if already in progress
      if (uploadsInProgress.current.has(fileIdentity)) {
        const existingPromise = uploadPromises.current.get(fileIdentity);
        if (existingPromise) {
          try {
            const result = await existingPromise;
            if (result) batchResults.push(result);
          } catch (error) {
            console.error('Error waiting for existing upload:', error);
          }
        }
        continue;
      }
      
      uploadsInProgress.current.add(fileIdentity);
      
      const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const uploadPromise = (async () => {
        try {
          // Compress image if needed
          const processedFile = await compressImageIfNeeded(file);
          const filePath = generateFilePath(processedFile);

          const initialFile: SimpleUploadedFile = {
            id: fileId,
            file: processedFile,
            url: '',
            name: processedFile.name,
            size: processedFile.size,
            type: processedFile.type,
            path: filePath,
            uploaded: false,
            progress: 0
          };

          // Add to files with immediate UI feedback
          setFiles(prev => {
            const exists = prev.some(f => f.id === fileId);
            if (exists) return prev;
            return [...prev, initialFile];
          });

          // Start upload with progress tracking
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 20 } : f
          ));

          console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`);
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, processedFile, {
              cacheControl: '3600',
              upsert: false
            });

          console.log('Supabase upload result:', { data, error });
          if (error) {
            console.error('Supabase storage error:', error);
            throw error;
          }

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          const completedFile: SimpleUploadedFile = {
            ...initialFile,
            url: urlData.publicUrl,
            uploaded: true,
            progress: 100
          };

          setFiles(prev => prev.map(f => 
            f.id === fileId ? completedFile : f
          ));

          processedFiles.current.set(fileIdentity, completedFile);
          return completedFile;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, error: errorMessage, progress: 0 } : f
          ));
          throw error;
        } finally {
          uploadsInProgress.current.delete(fileIdentity);
          uploadPromises.current.delete(fileIdentity);
        }
      })();
      
      uploadPromises.current.set(fileIdentity, uploadPromise);
      
      try {
        const result = await uploadPromise;
        if (result) batchResults.push(result);
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }
    
    return batchResults;
  }, [bucket, generateFilePath, getFileIdentity, compressImageIfNeeded]);

  const uploadFiles = useCallback(async (newFiles: File[]): Promise<SimpleUploadedFile[]> => {
    if (newFiles.length === 0) return [];
    
    console.log('Upload request for', newFiles.length, 'files (mobile optimized)');
    setIsUploading(true);
    
    try {
      // Mobile optimization: process files in smaller batches
      const batchSize = isMobile.current ? 2 : Math.min(newFiles.length, maxConcurrentUploads.current);
      const batches: File[][] = [];
      
      for (let i = 0; i < newFiles.length; i += batchSize) {
        batches.push(newFiles.slice(i, i + batchSize));
      }
      
      const allResults: SimpleUploadedFile[] = [];
      
      for (const batch of batches) {
        console.log(`Processing batch of ${batch.length} files`);
        const batchResults = await processBatch(batch);
        allResults.push(...batchResults);
        
        // Small delay between batches for mobile performance
        if (isMobile.current && batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (allResults.length > 0) {
        toast({
          title: "Upload complete",
          description: `Successfully uploaded ${allResults.length} file(s)`
        });
      }

      return allResults;

    } catch (error) {
      console.error('Batch upload error:', error);
      toast({
        title: "Upload failed", 
        description: "Some files failed to upload. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [processBatch, toast]);

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
    uploadPromises.current.clear();
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
    failedFiles: files.filter(f => !f.uploaded && f.error),
    uploadQueue: uploadQueue.length,
    isMobile: isMobile.current
  };
};
