
import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image } from 'lucide-react';
import { UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  files?: UploadedFile[] | File[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 10,
  className = "",
  label = "Upload Files",
  files = []
}) => {
  const [currentFiles, setCurrentFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Convert incoming files to UploadedFile format
  const convertToUploadedFiles = useCallback((fileList: UploadedFile[] | File[]): UploadedFile[] => {
    if (!fileList || fileList.length === 0) return [];
    
    return fileList.map((file, index) => {
      // If it's already an UploadedFile, return as is
      if ('id' in file && 'url' in file) {
        return file as UploadedFile;
      }
      
      // If it's a File, convert to UploadedFile
      const fileObj = file as File;
      return {
        id: `file-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file: fileObj,
        url: URL.createObjectURL(fileObj),
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type
      };
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
        type: file.type
      }));

      const updatedFiles = [...currentFiles, ...newUploadedFiles];
      setCurrentFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
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
    onFilesChange?.(updatedFiles);
  }, [currentFiles, onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: UploadedFile) => {
    return file.type.startsWith('image/');
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
            {label} ({currentFiles.length}/{maxFiles})
          </h4>
          <div className="grid gap-2">
            {currentFiles.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {isImage(file) && (
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
