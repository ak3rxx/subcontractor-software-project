
import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Image, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  files?: UploadedFile[] | File[];
}

interface FileWithProgress extends UploadedFile {
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'success' | 'failed';
  uploadError?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  onUploadStatusChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 10,
  className = "",
  label = "Upload Files",
  files = []
}) => {
  const [currentFiles, setCurrentFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  // Convert incoming files to UploadedFile format
  const convertToUploadedFiles = useCallback((fileList: UploadedFile[] | File[]): FileWithProgress[] => {
    if (!fileList || fileList.length === 0) return [];
    
    return fileList.map((file, index) => {
      // If it's already an UploadedFile, return as is
      if ('id' in file && 'url' in file) {
        return {
          ...(file as UploadedFile),
          uploadStatus: 'success'
        } as FileWithProgress;
      }
      
      // If it's a File, convert to UploadedFile
      const fileObj = file as File;
      return {
        id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file: fileObj,
        url: URL.createObjectURL(fileObj),
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type,
        uploadStatus: 'success'
      } as FileWithProgress;
    });
  }, []);

  // Initialize with provided files
  useEffect(() => {
    if (files && files.length > 0) {
      const convertedFiles = convertToUploadedFiles(files);
      setCurrentFiles(convertedFiles);
    } else {
      setCurrentFiles([]);
    }
  }, [files, convertToUploadedFiles]);

  // Notify parent about upload status
  useEffect(() => {
    const isUploading = currentFiles.some(f => f.uploadStatus === 'uploading');
    const hasFailures = currentFiles.some(f => f.uploadStatus === 'failed');
    onUploadStatusChange?.(isUploading, hasFailures);
  }, [currentFiles, onUploadStatusChange]);

  const simulateFileUpload = async (file: FileWithProgress): Promise<FileWithProgress> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          clearInterval(interval);
          // Simulate occasional failures (10% chance)
          const failed = Math.random() < 0.1;
          resolve({
            ...file,
            uploadProgress: 100,
            uploadStatus: failed ? 'failed' : 'success',
            uploadError: failed ? 'Upload failed - please try again' : undefined
          });
        } else {
          setCurrentFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, uploadProgress: progress } : f
          ));
        }
      }, 200);
    });
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check file limit
    if (currentFiles.length + selectedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    
    try {
      const newUploadedFiles = selectedFiles.map((file, index) => ({
        id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        uploadStatus: 'uploading' as const
      }));

      const updatedFiles = [...currentFiles, ...newUploadedFiles];
      setCurrentFiles(updatedFiles);

      // Upload files with progress
      const uploadPromises = newUploadedFiles.map(file => simulateFileUpload(file));
      const uploadedFiles = await Promise.all(uploadPromises);

      setCurrentFiles(prev => {
        const updated = prev.map(f => {
          const uploaded = uploadedFiles.find(uf => uf.id === f.id);
          return uploaded || f;
        });
        
        // Only notify with successfully uploaded files
        const successfulFiles = updated.filter(f => f.uploadStatus === 'success');
        onFilesChange?.(successfulFiles);
        
        return updated;
      });
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  }, [currentFiles, maxFiles, onFilesChange]);

  const handleRemoveFile = useCallback((fileId: string) => {
    const fileToRemove = currentFiles.find(f => f.id === fileId);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    setCurrentFiles(updatedFiles);
    
    // Only notify with successfully uploaded files
    const successfulFiles = updatedFiles.filter(f => f.uploadStatus === 'success');
    onFilesChange?.(successfulFiles);
  }, [currentFiles, onFilesChange]);

  const handleRetryUpload = useCallback(async (fileId: string) => {
    const fileToRetry = currentFiles.find(f => f.id === fileId);
    if (!fileToRetry) return;

    const updatedFile = { ...fileToRetry, uploadStatus: 'uploading' as const, uploadProgress: 0 };
    setCurrentFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));

    try {
      const result = await simulateFileUpload(updatedFile);
      setCurrentFiles(prev => {
        const updated = prev.map(f => f.id === fileId ? result : f);
        
        if (result.uploadStatus === 'success') {
          const successfulFiles = updated.filter(f => f.uploadStatus === 'success');
          onFilesChange?.(successfulFiles);
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error retrying upload:', error);
    }
  }, [currentFiles, onFilesChange]);

  const handleDownloadFile = useCallback((file: FileWithProgress) => {
    // Create download link
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: FileWithProgress) => {
    return file.type.startsWith('image/');
  };

  const getStatusIcon = (file: FileWithProgress) => {
    switch (file.uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors relative">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} files allowed
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || currentFiles.length >= maxFiles}
        />
        <Button
          variant="outline"
          className="mt-4"
          disabled={uploading || currentFiles.length >= maxFiles}
        >
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {label} ({currentFiles.filter(f => f.uploadStatus === 'success').length}/{maxFiles})
          </h4>
          <div className="grid gap-2">
            {currentFiles.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {isImage(file) ? (
                      <div className="relative">
                        <Image className="h-8 w-8 text-blue-500" />
                        <img
                          src={file.url}
                          alt={file.name}
                          className="absolute inset-0 h-8 w-8 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <FileText className="h-8 w-8 text-gray-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {file.uploadStatus === 'failed' && file.uploadError && (
                        <p className="text-xs text-red-600 mt-1">{file.uploadError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file)}
                    {file.uploadStatus === 'success' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {file.uploadStatus === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryUpload(file.id)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Retry upload"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar for uploading files */}
                {file.uploadStatus === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={file.uploadProgress || 0} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading... {Math.round(file.uploadProgress || 0)}%
                    </p>
                  </div>
                )}

                {/* Image preview for successfully uploaded images */}
                {isImage(file) && file.uploadStatus === 'success' && (
                  <div className="mt-2">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-full h-32 object-contain rounded border"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
