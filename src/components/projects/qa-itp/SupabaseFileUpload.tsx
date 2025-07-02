import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, FileText, Image, Download, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useSupabaseFileUpload, SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';

interface SupabaseFileUploadProps {
  onFilesChange?: (files: SupabaseUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  files?: SupabaseUploadedFile[];
  inspectionId?: string;
  checklistItemId?: string;
}

const SupabaseFileUpload: React.FC<SupabaseFileUploadProps> = ({
  onFilesChange,
  onUploadStatusChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 10,
  className = "",
  label = "Upload Files",
  files = [],
  inspectionId,
  checklistItemId
}) => {
  const { uploadFiles, uploading, hasUploadFailures, removeFile, retryFailedUpload } = useSupabaseFileUpload();
  const [currentFiles, setCurrentFiles] = useState<SupabaseUploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize with provided files
  useEffect(() => {
    if (files && files.length > 0) {
      console.log('Initializing with files:', files);
      setCurrentFiles(files);
    } else {
      setCurrentFiles([]);
    }
  }, [files]);

  // Notify parent about upload status
  useEffect(() => {
    const fileHasFailures = currentFiles.some(f => !f.uploaded);
    onUploadStatusChange?.(uploading, fileHasFailures);
  }, [uploading, currentFiles, onUploadStatusChange]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    console.log('Selected files for upload:', selectedFiles.map(f => f.name));

    // Check file limit
    if (currentFiles.length + selectedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    try {
      // Upload files to Supabase
      const uploadedFiles = await uploadFiles(selectedFiles, inspectionId, checklistItemId);
      console.log('Files uploaded successfully:', uploadedFiles);
      
      const updatedFiles = [...currentFiles, ...uploadedFiles];
      setCurrentFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      // Reset input
      event.target.value = '';
    }
  }, [currentFiles, maxFiles, onFilesChange, uploadFiles, inspectionId, checklistItemId]);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    console.log('Removing file:', fileId);
    await removeFile(fileId);
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    setCurrentFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  }, [currentFiles, onFilesChange, removeFile]);

  const handleRetryUpload = useCallback(async (fileId: string) => {
    console.log('Retrying upload for file:', fileId);
    await retryFailedUpload(fileId, inspectionId, checklistItemId);
    // The hook will automatically update the files list
  }, [retryFailedUpload, inspectionId, checklistItemId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    console.log('Dropped files:', droppedFiles.map(f => f.name));

    // Check file limit
    if (currentFiles.length + droppedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    try {
      // Upload files to Supabase
      const uploadedFiles = await uploadFiles(droppedFiles, inspectionId, checklistItemId);
      console.log('Dropped files uploaded successfully:', uploadedFiles);
      
      const updatedFiles = [...currentFiles, ...uploadedFiles];
      setCurrentFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    } catch (error) {
      console.error('Error uploading dropped files:', error);
    }
  }, [currentFiles, maxFiles, onFilesChange, uploadFiles, inspectionId, checklistItemId]);

  const handleDownloadFile = useCallback((file: SupabaseUploadedFile) => {
    if (file.uploaded && file.url) {
      console.log('Opening file URL:', file.url);
      window.open(file.url, '_blank');
    } else {
      console.warn('File not uploaded or URL missing:', file);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: SupabaseUploadedFile) => {
    return file.type.startsWith('image/');
  };

  const isPDF = (file: SupabaseUploadedFile) => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };

  // Get PDF files for special notation
  const pdfFiles = currentFiles.filter(isPDF);
  const failedFiles = currentFiles.filter(f => !f.uploaded);

  return (
    <div className={`space-y-4 ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : uploading || currentFiles.length >= maxFiles
              ? 'border-muted-foreground/30 bg-muted/30' 
              : 'border-muted-foreground/50 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="space-y-2">
          <p className={`text-sm ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
            {isDragOver ? 'Drop files here!' : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} files allowed • Accepts {accept}
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || currentFiles.length >= maxFiles}
          style={{ pointerEvents: isDragOver ? 'none' : 'auto' }}
        />
        <Button
          variant="outline"
          className="mt-4 pointer-events-none relative z-10"
          disabled={uploading || currentFiles.length >= maxFiles}
        >
          {uploading ? 'Uploading...' : isDragOver ? 'Drop files here!' : 'Choose Files'}
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

      {/* Upload Failures */}
      {failedFiles.length > 0 && (
        <div className="p-3 rounded-lg border bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Upload Failures:</p>
              <ul className="text-xs text-red-700 mt-1 space-y-1">
                {failedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between">
                    <span>{file.name} - {file.error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetryUpload(file.id)}
                      className="text-red-600 hover:text-red-800 h-5 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
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
                    {file.uploaded && <CheckCircle className="h-3 w-3 text-green-600" />}
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
              <Card key={file.id} className={`p-3 ${isPDF(file) ? 'border-amber-200 bg-amber-50' : file.uploaded ? '' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {isImage(file) && file.uploaded ? (
                      <div className="relative">
                        <Image className="h-8 w-8 text-blue-500" />
                        <img
                          src={file.url}
                          alt={file.name}
                          className="absolute inset-0 h-8 w-8 object-cover rounded"
                          onError={(e) => {
                            console.error('Failed to load image:', file.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <FileText className={`h-8 w-8 ${isPDF(file) ? 'text-amber-600' : 'text-gray-500'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPDF(file) ? 'text-amber-900' : file.uploaded ? 'text-gray-900' : 'text-red-900'}`}>
                        {file.name}
                        {isPDF(file) && <span className="ml-2 text-xs text-amber-600 font-normal">(PDF)</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {!file.uploaded && file.error && (
                        <p className="text-xs text-red-600">{file.error}</p>
                      )}
                      {file.uploaded && (
                        <p className="text-xs text-gray-400">
                          URL: {file.url.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.uploaded ? (
                      <>
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
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryUpload(file.id)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Retry upload"
                      >
                        <RotateCcw className="h-4 w-4" />
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

                {/* Image preview for successfully uploaded images */}
                {isImage(file) && file.uploaded && (
                  <div className="mt-2">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-full h-32 object-contain rounded border"
                      onError={(e) => {
                        console.error('Failed to load preview image:', file.url);
                        e.currentTarget.style.display = 'none';
                      }}
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

export default SupabaseFileUpload;
