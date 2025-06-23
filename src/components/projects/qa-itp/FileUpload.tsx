
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, Image } from 'lucide-react';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 10,
  className = ""
}) => {
  const { uploadedFiles, uploading, uploadFiles, removeFile } = useFileUpload();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check file limit
    if (uploadedFiles.length + files.length > maxFiles) {
      return;
    }

    const newFiles = await uploadFiles(files);
    onFilesChange?.(uploadedFiles.concat(newFiles));
    
    // Reset input
    event.target.value = '';
  }, [uploadFiles, uploadedFiles, maxFiles, onFilesChange]);

  const handleRemoveFile = useCallback((fileId: string) => {
    removeFile(fileId);
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    onFilesChange?.(updatedFiles);
  }, [removeFile, uploadedFiles, onFilesChange]);

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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
          disabled={uploading || uploadedFiles.length >= maxFiles}
        />
        <Button
          variant="outline"
          className="mt-4"
          disabled={uploading || uploadedFiles.length >= maxFiles}
        >
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="grid gap-2">
            {uploadedFiles.map((file) => (
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
