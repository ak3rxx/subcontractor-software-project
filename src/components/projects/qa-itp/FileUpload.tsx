
import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Image, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { UploadedFile, useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  files?: UploadedFile[];
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
  const { uploadFiles, uploading, removeFile } = useFileUpload();
  const [currentFiles, setCurrentFiles] = useState<UploadedFile[]>([]);

  // Initialize with provided files
  useEffect(() => {
    if (files && files.length > 0) {
      setCurrentFiles(files);
    } else {
      setCurrentFiles([]);
    }
  }, [files]);

  // Notify parent about upload status
  useEffect(() => {
    onUploadStatusChange?.(uploading, false);
  }, [uploading, onUploadStatusChange]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check file limit
    if (currentFiles.length + selectedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    try {
      // Use the real file upload hook
      const uploadedFiles = await uploadFiles(selectedFiles);
      
      const updatedFiles = [...currentFiles, ...uploadedFiles];
      setCurrentFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      // Reset input
      event.target.value = '';
    }
  }, [currentFiles, maxFiles, onFilesChange, uploadFiles]);

  const handleRemoveFile = useCallback((fileId: string) => {
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    setCurrentFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    
    // Also remove from the file upload hook
    removeFile(fileId);
  }, [currentFiles, onFilesChange, removeFile]);

  const handleDownloadFile = useCallback((file: UploadedFile) => {
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

  const isImage = (file: UploadedFile) => {
    return file.type.startsWith('image/');
  };

  const isPDF = (file: UploadedFile) => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };

  // Get PDF files for special notation
  const pdfFiles = currentFiles.filter(isPDF);

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

      {uploading && (
        <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            <span className="text-sm font-medium">Uploading files...</span>
          </div>
        </div>
      )}

      {/* PDF Files Notation */}
      {pdfFiles.length > 0 && (
        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">PDF Documents Attached:</p>
              <ul className="text-xs text-amber-700 mt-1 space-y-1">
                {pdfFiles.map((file) => (
                  <li key={file.id} className="flex items-center gap-1">
                    <span>•</span>
                    <span className="font-mono">{file.name}</span>
                    <span className="text-amber-600">({formatFileSize(file.size)})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {label} ({currentFiles.length}/{maxFiles})
          </h4>
          <div className="grid gap-2">
            {currentFiles.map((file) => (
              <Card key={file.id} className={`p-3 ${isPDF(file) ? 'border-amber-200 bg-amber-50' : ''}`}>
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
                      <FileText className={`h-8 w-8 ${isPDF(file) ? 'text-amber-600' : 'text-gray-500'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPDF(file) ? 'text-amber-900' : 'text-gray-900'}`}>
                        {file.name}
                        {isPDF(file) && <span className="ml-2 text-xs text-amber-600 font-normal">(PDF)</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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

                {/* Image preview for successfully uploaded images */}
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
