
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
}

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    setUploading(true);
    try {
      // Create a temporary URL for the file
      const url = URL.createObjectURL(file);
      
      const uploadedFile: UploadedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url,
        name: file.name,
        size: file.size,
        type: file.type
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`
      });

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    const results = await Promise.all(files.map(uploadFile));
    return results.filter((file): file is UploadedFile => file !== null);
  }, [uploadFile]);

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  const clearFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      URL.revokeObjectURL(file.url);
    });
    setUploadedFiles([]);
  }, [uploadedFiles]);

  return {
    uploadedFiles,
    uploading,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles
  };
};
