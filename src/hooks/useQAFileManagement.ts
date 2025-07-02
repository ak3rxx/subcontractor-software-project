import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QAUploadedFile {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  uploaded: boolean;
}

export const useQAFileManagement = () => {
  const [uploading, setUploading] = useState(false);
  const [hasFailures, setHasFailures] = useState(false);
  const { toast } = useToast();

  const generateFilePath = (inspectionId: string, itemId: string, fileName: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = fileName.split('.').pop();
    return `${inspectionId}/${itemId}/${timestamp}-${randomId}.${extension}`;
  };

  const uploadFile = async (
    file: File,
    inspectionId: string,
    itemId: string
  ): Promise<QAUploadedFile | null> => {
    try {
      setUploading(true);
      setHasFailures(false);

      const filePath = generateFilePath(inspectionId, itemId, file.name);
      
      const { data, error } = await supabase.storage
        .from('qainspectionfiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        setHasFailures(true);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qainspectionfiles')
        .getPublicUrl(data.path);

      const uploadedFile: QAUploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        name: file.name,
        path: data.path,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type,
        uploaded: true
      };

      return uploadedFile;
    } catch (error) {
      console.error('Upload error:', error);
      setHasFailures(true);
      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('qainspectionfiles')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Delete Failed",
          description: `Failed to delete file: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('qainspectionfiles')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }

    return { valid: true };
  };

  const convertFilePathsToUrls = (filePaths: string[]): string[] => {
    return filePaths.map(path => getFileUrl(path));
  };

  const extractFilePathsFromFiles = (files: QAUploadedFile[]): string[] => {
    return files.filter(f => f.uploaded).map(f => f.path);
  };

  return {
    uploading,
    hasFailures,
    uploadFile,
    deleteFile,
    getFileUrl,
    validateFile,
    convertFilePathsToUrls,
    extractFilePathsFromFiles,
    setUploading,
    setHasFailures
  };
};