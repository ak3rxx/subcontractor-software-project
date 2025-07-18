import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedQANotifications } from '@/hooks/useEnhancedQANotifications';

export interface QAUploadedFile {
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
  retryCount?: number;
  linkedToItemId?: string;
  thumbnailUrl?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  inspectionId?: string;
  checklistItemId?: string;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
}

interface UseQAUploadManagerOptions {
  bucket?: string;
  folder?: string;
  maxConcurrentUploads?: number;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
}

export const useQAUploadManager = (options: UseQAUploadManagerOptions = {}) => {
  const {
    bucket = 'qainspectionfiles',
    folder,
    maxConcurrentUploads = 3,
    enableAutoSave = true,
    autoSaveInterval = 30000
  } = options;

  const [uploadedFiles, setUploadedFiles] = useState<QAUploadedFile[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const [analytics, setAnalytics] = useState({
    totalUploaded: 0,
    totalFailed: 0,
    averageUploadTime: 0,
    lastUploadTime: 0
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const qaNotifications = useEnhancedQANotifications();
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const uploadStartTimes = useRef<Map<string, number>>(new Map());

  // Auto-save functionality with conflict prevention
  useEffect(() => {
    if (enableAutoSave && uploadedFiles.length > 0) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Use longer interval to prevent conflicts with form auto-save
      autoSaveTimerRef.current = setTimeout(() => {
        saveToLocalStorage();
        // Only notify occasionally to prevent spam
        if (uploadedFiles.length % 5 === 0) {
          qaNotifications.notifyAutoSave(uploadedFiles.length);
        }
      }, autoSaveInterval + 5000); // Offset by 5 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [uploadedFiles, enableAutoSave, autoSaveInterval, qaNotifications]);

  // Generate consistent file path
  const generateFilePath = useCallback((
    file: File,
    inspectionId?: string,
    checklistItemId?: string
  ): string => {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomId}.${fileExt}`;
    
    if (inspectionId && checklistItemId) {
      return `${inspectionId}/${checklistItemId}/${fileName}`;
    } else if (inspectionId) {
      return `${inspectionId}/general/${fileName}`;
    } else {
      return `temp/${user?.id || 'anonymous'}/${fileName}`;
    }
  }, [user]);

  // Upload single file with real-time progress tracking
  const uploadSingleFile = useCallback(async (
    queueItem: UploadQueueItem
  ): Promise<QAUploadedFile | null> => {
    if (!user) {
      qaNotifications.notifyUploadError(queueItem.file.name, 'Authentication required');
      return null;
    }

    const fileId = queueItem.id;
    const filePath = generateFilePath(queueItem.file, queueItem.inspectionId, queueItem.checklistItemId);
    
    uploadStartTimes.current.set(fileId, Date.now());
    
    // Create initial file object with 10% progress to show start
    const initialFile: QAUploadedFile = {
      id: fileId,
      file: queueItem.file,
      url: '',
      name: queueItem.file.name,
      size: queueItem.file.size,
      type: queueItem.file.type,
      path: filePath,
      uploaded: false,
      progress: 10,
      retryCount: queueItem.retryCount,
      linkedToItemId: queueItem.checklistItemId
    };

    // Add to uploaded files with initial state
    setUploadedFiles(prev => {
      const existing = prev.find(f => f.id === fileId);
      if (existing) {
        return prev.map(f => f.id === fileId ? initialFile : f);
      }
      return [...prev, initialFile];
    });

    // Simulate progress updates for better UX
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId && !f.uploaded ? {
          ...f,
          progress: Math.min(f.progress + Math.random() * 15, 90)
        } : f)
      );
    }, 200);

    try {
      console.log(`Starting upload for ${queueItem.file.name} to ${filePath}`);
      
      // Upload to Supabase with optimized settings
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, queueItem.file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log(`Upload successful for ${queueItem.file.name}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined;
      if (queueItem.file.type.startsWith('image/')) {
        thumbnailUrl = `${urlData.publicUrl}?width=200&height=200&resize=contain`;
      }

      const completedFile: QAUploadedFile = {
        ...initialFile,
        url: urlData.publicUrl,
        uploaded: true,
        progress: 100,
        thumbnailUrl
      };

      // Update file as completed
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? completedFile : f)
      );

      // Update analytics
      const uploadTime = Date.now() - (uploadStartTimes.current.get(fileId) || Date.now());
      setAnalytics(prev => ({
        ...prev,
        totalUploaded: prev.totalUploaded + 1,
        averageUploadTime: (prev.averageUploadTime + uploadTime) / 2,
        lastUploadTime: uploadTime
      }));

      uploadStartTimes.current.delete(fileId);
      qaNotifications.notifyUploadSuccess(queueItem.file.name, urlData.publicUrl);
      
      return completedFile;
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error(`Upload failed for ${queueItem.file.name}:`, errorMessage);
      
      // Update file with error state
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? {
          ...f,
          uploaded: false,
          progress: 0,
          error: errorMessage
        } : f)
      );

      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalFailed: prev.totalFailed + 1
      }));

      uploadStartTimes.current.delete(fileId);
      
      // Determine if retry is possible
      const canRetry = queueItem.retryCount < queueItem.maxRetries;
      qaNotifications.notifyUploadError(
        queueItem.file.name, 
        errorMessage, 
        canRetry ? () => retryUpload(fileId) : undefined
      );
      
      return null;
    }
  }, [user, bucket, generateFilePath, qaNotifications]);

  // Simplified queue processing with while-loop approach
  const processQueue = useCallback(async () => {
    if (isPaused || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Simple while-loop based processing
      while (uploadQueue.length > 0 && !isPaused) {
        const availableSlots = maxConcurrentUploads - activeUploads.size;
        if (availableSlots <= 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const itemsToProcess = uploadQueue
          .slice(0, availableSlots)
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });

        if (itemsToProcess.length === 0) break;

        // Remove items from queue immediately
        setUploadQueue(prev => prev.slice(itemsToProcess.length));
        
        // Add to active uploads
        setActiveUploads(prev => {
          const newSet = new Set(prev);
          itemsToProcess.forEach(item => newSet.add(item.id));
          return newSet;
        });

        // Process items concurrently with proper cleanup
        const uploadPromises = itemsToProcess.map(async (item) => {
          try {
            await uploadSingleFile(item);
          } catch (error) {
            console.error(`Failed to upload ${item.file.name}:`, error);
          } finally {
            // Remove from active uploads
            setActiveUploads(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.id);
              return newSet;
            });
          }
        });

        await Promise.all(uploadPromises);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      setIsProcessing(false);
    }
  }, [uploadQueue, activeUploads, maxConcurrentUploads, isPaused, isProcessing, uploadSingleFile]);

  // Add files to upload queue with immediate processing
  const queueFiles = useCallback((
    files: File[],
    inspectionId?: string,
    checklistItemId?: string,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    console.log(`Queueing ${files.length} files for upload with priority: ${priority}`);
    
    const newItems: UploadQueueItem[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      inspectionId,
      checklistItemId,
      priority,
      retryCount: 0,
      maxRetries: 3
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    
    qaNotifications.notifyUploadStart(`${files.length} files`, 0, files.length);
    
    // Start processing immediately
    processQueue();
  }, [qaNotifications, processQueue]);

  // Retry failed upload
  const retryUpload = useCallback((fileId: string) => {
    const failedFile = uploadedFiles.find(f => f.id === fileId && !f.uploaded);
    if (!failedFile) return;

    const queueItem: UploadQueueItem = {
      id: fileId,
      file: failedFile.file,
      inspectionId: failedFile.linkedToItemId ? undefined : undefined, // Will need proper tracking
      checklistItemId: failedFile.linkedToItemId,
      priority: 'high', // Retries get high priority
      retryCount: (failedFile.retryCount || 0) + 1,
      maxRetries: 3
    };

    setUploadQueue(prev => [...prev, queueItem]);
    processQueue();
  }, [uploadedFiles, processQueue]);

  // Remove file and cleanup
  const removeFile = useCallback(async (fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    if (!fileToRemove) return;

    // Remove from storage if uploaded
    if (fileToRemove.uploaded && fileToRemove.path) {
      try {
        await supabase.storage.from(bucket).remove([fileToRemove.path]);
      } catch (error) {
        console.error('Failed to delete file from storage:', error);
      }
    }

    // Remove from local state
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, [uploadedFiles, bucket]);

  // Pause/resume queue processing
  const pauseQueue = useCallback(() => setIsPaused(true), []);
  const resumeQueue = useCallback(() => {
    setIsPaused(false);
    processQueue();
  }, [processQueue]);

  // Clear all files
  const clearAllFiles = useCallback(async () => {
    const uploadedPaths = uploadedFiles
      .filter(f => f.uploaded && f.path)
      .map(f => f.path);

    if (uploadedPaths.length > 0) {
      try {
        await supabase.storage.from(bucket).remove(uploadedPaths);
      } catch (error) {
        console.error('Failed to clear files from storage:', error);
      }
    }

    setUploadedFiles([]);
    setUploadQueue([]);
    setActiveUploads(new Set());
  }, [uploadedFiles, bucket]);

  // Save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const saveData = {
      files: uploadedFiles.filter(f => f.uploaded),
      timestamp: Date.now()
    };
    localStorage.setItem('qa-upload-draft', JSON.stringify(saveData));
  }, [uploadedFiles]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('qa-upload-draft');
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if saved within last 24 hours
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          setUploadedFiles(data.files || []);
          return data.files?.length || 0;
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return 0;
  }, []);

  // Calculate overall progress
  useEffect(() => {
    const totalFiles = uploadedFiles.length + uploadQueue.length;
    const completedFiles = uploadedFiles.filter(f => f.uploaded).length;
    const progress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;
    setTotalProgress(progress);
  }, [uploadedFiles, uploadQueue]);

  return {
    // State
    uploadedFiles,
    uploadQueue: uploadQueue.length,
    activeUploads: activeUploads.size,
    isProcessing,
    isPaused,
    totalProgress,
    analytics,
    
    // Actions
    queueFiles,
    retryUpload,
    removeFile,
    pauseQueue,
    resumeQueue,
    clearAllFiles,
    saveToLocalStorage,
    loadFromLocalStorage,
    
    // Computed values
    hasFailures: uploadedFiles.some(f => !f.uploaded && f.error),
    isUploading: activeUploads.size > 0 || uploadQueue.length > 0,
    completedFiles: uploadedFiles.filter(f => f.uploaded),
    failedFiles: uploadedFiles.filter(f => !f.uploaded && f.error)
  };
};