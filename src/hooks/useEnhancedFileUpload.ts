import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedUploadedFile {
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
  retryCount: number;
}

interface UploadQueueItem {
  file: File;
  fileId: string;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

interface UseEnhancedFileUploadOptions {
  bucket?: string;
  inspectionId?: string;
  checklistItemId?: string;
  maxRetries?: number;
  enableOfflineQueue?: boolean;
}

export const useEnhancedFileUpload = (options: UseEnhancedFileUploadOptions = {}) => {
  const { 
    bucket = 'qainspectionfiles', 
    inspectionId, 
    checklistItemId,
    maxRetries = 3,
    enableOfflineQueue = true 
  } = options;
  
  const [files, setFiles] = useState<EnhancedUploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  
  // Enhanced tracking and optimization
  const uploadsInProgress = useRef<Set<string>>(new Set());
  const processedFiles = useRef<Map<string, EnhancedUploadedFile>>(new Map());
  const failedUploads = useRef<Set<string>>(new Set());
  const isMobile = useRef(typeof window !== 'undefined' && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
  const maxConcurrentUploads = useRef(isMobile.current ? 2 : 4);
  const chunkSize = useRef(isMobile.current ? 1024 * 1024 : 5 * 1024 * 1024); // 1MB mobile, 5MB desktop

  // Network status monitoring
  const setupNetworkMonitoring = useCallback(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (enableOfflineQueue && uploadQueue.length > 0) {
        console.log('Back online, processing queued uploads');
        processUploadQueue();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Gone offline, uploads will be queued');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineQueue, uploadQueue.length]);

  // Enhanced file compression with quality optimization
  const compressImageWithQuality = useCallback(async (file: File, quality = 0.8): Promise<File> => {
    if (!file.type.startsWith('image/') || file.size < 500 * 1024) return file; // Skip compression for non-images or files < 500KB
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Smart resizing based on device and image characteristics
        const maxDimension = isMobile.current ? 1920 : 2560;
        const targetSize = isMobile.current ? 800 * 1024 : 2 * 1024 * 1024; // Target 800KB mobile, 2MB desktop
        
        let ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
        
        // Further reduce if file is still too large
        if (file.size > targetSize && ratio > 0.5) {
          const sizeRatio = Math.sqrt(targetSize / file.size);
          ratio = Math.min(ratio, sizeRatio);
        }
        
        if (ratio >= 1) {
          resolve(file); // No compression needed
          return;
        }
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob && blob.size < file.size) {
            const compressedFile = new File([blob], file.name, { type: file.type });
            console.log(`Compressed ${file.name} from ${(file.size/1024/1024).toFixed(2)}MB to ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Chunked upload for large files
  const uploadFileInChunks = useCallback(async (file: File, filePath: string, fileId: string): Promise<string> => {
    const fileSize = file.size;
    const chunks = Math.ceil(fileSize / chunkSize.current);
    
    if (chunks === 1) {
      // Single upload for small files
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      return filePath;
    }
    
    // Multi-part upload for large files
    console.log(`Uploading ${file.name} in ${chunks} chunks`);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize.current;
      const end = Math.min(start + chunkSize.current, fileSize);
      const chunk = file.slice(start, end);
      const chunkPath = `${filePath}.chunk.${i}`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Update progress
      const progress = Math.round(((i + 1) / chunks) * 100);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress } : f
      ));
    }
    
    // Combine chunks (this would need a backend function in practice)
    // For now, we'll upload the full file after chunking as a fallback
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Clean up chunk files
    const chunkPaths = Array.from({ length: chunks }, (_, i) => `${filePath}.chunk.${i}`);
    await supabase.storage.from(bucket).remove(chunkPaths);
    
    return filePath;
  }, [bucket]);

  // Enhanced retry logic with exponential backoff
  const retryUploadWithBackoff = useCallback(async (
    queueItem: UploadQueueItem,
    attempt: number = 1
  ): Promise<EnhancedUploadedFile | null> => {
    const { file, fileId } = queueItem;
    const maxAttempts = maxRetries + 1;
    
    if (attempt > maxAttempts) {
      console.error(`Upload failed after ${maxAttempts} attempts:`, file.name);
      return null;
    }
    
    const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Cap at 30 seconds
    
    if (attempt > 1) {
      console.log(`Retrying upload (attempt ${attempt}/${maxAttempts}) for ${file.name} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
    
    try {
      const processedFile = await compressImageWithQuality(file);
      const filePath = generateFilePath(processedFile);
      
      // Update progress to show retry attempt
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          progress: 10 * attempt, 
          error: attempt > 1 ? `Retrying... (${attempt}/${maxAttempts})` : undefined 
        } : f
      ));
      
      const finalPath = await uploadFileInChunks(processedFile, filePath, fileId);
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(finalPath);
      
      const completedFile: EnhancedUploadedFile = {
        id: fileId,
        file: processedFile,
        url: urlData.publicUrl,
        name: processedFile.name,
        size: processedFile.size,
        type: processedFile.type,
        path: finalPath,
        uploaded: true,
        progress: 100,
        retryCount: attempt - 1
      };
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? completedFile : f
      ));
      
      return completedFile;
      
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed for ${file.name}:`, error);
      
      if (attempt < maxAttempts) {
        return retryUploadWithBackoff(queueItem, attempt + 1);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed after retries';
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            error: errorMessage, 
            progress: 0, 
            retryCount: maxRetries 
          } : f
        ));
        return null;
      }
    }
  }, [maxRetries, compressImageWithQuality, uploadFileInChunks, bucket]);

  // Process upload queue with concurrency control
  const processUploadQueue = useCallback(async () => {
    if (!isOnline && enableOfflineQueue) {
      console.log('Offline - uploads queued');
      return;
    }
    
    if (uploadQueue.length === 0 || uploadsInProgress.current.size >= maxConcurrentUploads.current) {
      return;
    }
    
    setIsUploading(true);
    
    const promises = uploadQueue
      .slice(0, maxConcurrentUploads.current)
      .map(async (queueItem) => {
        uploadsInProgress.current.add(queueItem.fileId);
        
        try {
          return await retryUploadWithBackoff(queueItem);
        } finally {
          uploadsInProgress.current.delete(queueItem.fileId);
          setUploadQueue(prev => prev.filter(q => q.fileId !== queueItem.fileId));
        }
      });
    
    const results = await Promise.allSettled(promises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failCount = results.filter(r => r.status === 'rejected' || !r.value).length;
    
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} file(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`
      });
    }
    
    if (failCount > 0) {
      toast({
        title: "Some uploads failed",
        description: `${failCount} file(s) failed to upload. Check and retry if needed.`,
        variant: "destructive"
      });
    }
    
    setIsUploading(false);
    
    // Process remaining queue
    if (uploadQueue.length > maxConcurrentUploads.current) {
      setTimeout(processUploadQueue, 1000);
    }
  }, [uploadQueue, isOnline, enableOfflineQueue, retryUploadWithBackoff, toast]);

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

  // Enhanced upload function
  const uploadFiles = useCallback(async (newFiles: File[]): Promise<EnhancedUploadedFile[]> => {
    if (newFiles.length === 0) return [];
    
    console.log('Enhanced upload request for', newFiles.length, 'files');
    
    const queueItems: UploadQueueItem[] = newFiles.map(file => {
      const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to files state immediately for UI feedback
      const initialFile: EnhancedUploadedFile = {
        id: fileId,
        file,
        url: '',
        name: file.name,
        size: file.size,
        type: file.type,
        path: '',
        uploaded: false,
        progress: 0,
        retryCount: 0
      };
      
      setFiles(prev => [...prev, initialFile]);
      
      return {
        file,
        fileId,
        retryCount: 0,
        priority: file.size > 10 * 1024 * 1024 ? 'low' : 'normal' // Large files get lower priority
      };
    });
    
    // Add to upload queue
    setUploadQueue(prev => [...prev, ...queueItems]);
    
    // Start processing queue
    setTimeout(processUploadQueue, 100);
    
    return [];
  }, [processUploadQueue]);

  // Enhanced remove function
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

    // Remove from queue if pending
    setUploadQueue(prev => prev.filter(q => q.fileId !== fileId));
    
    // Remove from state
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, [files, bucket]);

  // Manual retry function
  const retryFailedUpload = useCallback(async (fileId: string) => {
    const failedFile = files.find(f => f.id === fileId && !f.uploaded);
    if (!failedFile) return;

    console.log('Manual retry for:', failedFile.name);
    
    // Add back to queue with higher priority
    const queueItem: UploadQueueItem = {
      file: failedFile.file,
      fileId,
      retryCount: 0,
      priority: 'high'
    };
    
    setUploadQueue(prev => [queueItem, ...prev]); // Add to front of queue
    processUploadQueue();
  }, [files, processUploadQueue]);

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
    setUploadQueue([]);
    uploadsInProgress.current.clear();
    processedFiles.current.clear();
  }, [files, bucket]);

  return {
    files,
    isUploading,
    uploadFiles,
    removeFile,
    retryUpload: retryFailedUpload,
    clearFiles,
    hasFailures: files.some(f => !f.uploaded && f.error),
    completedFiles: files.filter(f => f.uploaded),
    failedFiles: files.filter(f => !f.uploaded && f.error),
    uploadQueue: uploadQueue.length,
    isOnline,
    isMobile: isMobile.current,
    setupNetworkMonitoring
  };
};