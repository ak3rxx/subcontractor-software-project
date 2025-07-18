
import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, FileText, Image, Download, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useSimpleFileUpload, SimpleUploadedFile } from '@/hooks/useSimpleFileUpload';

interface SimpleFileUploadProps {
  onFilesChange?: (files: SimpleUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  files?: SimpleUploadedFile[];
  inspectionId?: string;
  checklistItemId?: string;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
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
  const { 
    files: uploadedFiles, 
    isUploading, 
    uploadFiles, 
    removeFile, 
    retryUpload,
    hasFailures
  } = useSimpleFileUpload({
    inspectionId,
    checklistItemId
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const lastNotifiedFiles = useRef<SimpleUploadedFile[]>([]);

  // Only notify parent when files actually change - prevents infinite loop
  const notifyFilesChange = useCallback((files: SimpleUploadedFile[]) => {
    // Deep comparison to prevent unnecessary notifications
    const filesChanged = files.length !== lastNotifiedFiles.current.length ||
      files.some((file, index) => {
        const lastFile = lastNotifiedFiles.current[index];
        return !lastFile || 
               file.id !== lastFile.id || 
               file.uploaded !== lastFile.uploaded ||
               file.progress !== lastFile.progress;
      });

    if (filesChanged) {
      console.log('Files actually changed, notifying parent:', files.length);
      lastNotifiedFiles.current = [...files];
      onFilesChange?.(files);
    }
  }, [onFilesChange]);

  // Custom upload handler that notifies parent only after successful upload
  const handleUpload = useCallback(async (filesToUpload: File[]) => {
    console.log('Starting upload for', filesToUpload.length, 'files');
    const uploadedResults = await uploadFiles(filesToUpload);
    
    // Only notify if we have successful uploads
    if (uploadedResults.length > 0) {
      // Get the current complete file list after upload
      const currentFiles = [...uploadedFiles, ...uploadedResults];
      notifyFilesChange(currentFiles);
    }
  }, [uploadFiles, uploadedFiles, notifyFilesChange]);

  // Notify parent about upload status changes
  React.useEffect(() => {
    onUploadStatusChange?.(isUploading, hasFailures);
  }, [isUploading, hasFailures, onUploadStatusChange]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check file limit
    if (uploadedFiles.length + selectedFiles.length > maxFiles) {
      return;
    }

    await handleUpload(selectedFiles);
    event.target.value = '';
  }, [uploadedFiles.length, maxFiles, handleUpload]);

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

    // Check file limit
    if (uploadedFiles.length + droppedFiles.length > maxFiles) {
      return;
    }

    await handleUpload(droppedFiles);
  }, [uploadedFiles.length, maxFiles, handleUpload]);

  const handleDownloadFile = useCallback((file: SimpleUploadedFile) => {
    if (file.uploaded && file.url) {
      window.open(file.url, '_blank');
    }
  }, []);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    console.log('Removing file:', fileId);
    await removeFile(fileId);
    // Notify parent after removal
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    notifyFilesChange(updatedFiles);
  }, [removeFile, uploadedFiles, notifyFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: SimpleUploadedFile) => file.type.startsWith('image/');
  const isPDF = (file: SimpleUploadedFile) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  const failedFiles = uploadedFiles.filter(f => !f.uploaded && f.error);
  const pdfFiles = uploadedFiles.filter(isPDF);

  return (
    <div className={`space-y-4 ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors relative ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : isUploading || uploadedFiles.length >= maxFiles
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
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        />
        <Button
          variant="outline"
          className="mt-4 pointer-events-none relative z-10"
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

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
                      onClick={() => retryUpload(file.id)}
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

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {label} ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="grid gap-2">
            {uploadedFiles.map((file) => (
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
                        {formatFileSize(file.size)} • {file.progress}%
                      </p>
                      {!file.uploaded && file.error && (
                        <p className="text-xs text-red-600">{file.error}</p>
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
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryUpload(file.id)}
                        className="text-blue-500 hover:text-blue-700"
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

export default SimpleFileUpload;
