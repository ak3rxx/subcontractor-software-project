import React, { useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, RotateCcw, Check, AlertCircle, Image, FileText } from 'lucide-react';
import { useSimpleFileUpload, SimpleUploadedFile } from '@/hooks/useSimpleFileUpload';
import { cn } from '@/lib/utils';

interface MobileOptimizedFileUploadProps {
  onFilesChange?: (files: SimpleUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  inspectionId?: string;
  checklistItemId?: string;
}

const MobileOptimizedFileUpload: React.FC<MobileOptimizedFileUploadProps> = ({
  onFilesChange,
  onUploadStatusChange,
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  maxFiles = 10,
  className,
  inspectionId,
  checklistItemId
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastNotifiedFiles = useRef<SimpleUploadedFile[]>([]);

  const { 
    files, 
    isUploading, 
    uploadFiles, 
    removeFile, 
    retryUpload,
    hasFailures,
    completedFiles,
    failedFiles,
    isMobile
  } = useSimpleFileUpload({ 
    inspectionId, 
    checklistItemId,
    bucket: 'qainspectionfiles'
  });

  // Notify parent of file changes (with deep comparison to avoid loops)
  const notifyFilesChange = useCallback(() => {
    const currentFiles = completedFiles;
    const lastFiles = lastNotifiedFiles.current;
    
    // Deep comparison to avoid unnecessary updates
    const hasChanged = currentFiles.length !== lastFiles.length ||
      currentFiles.some((file, index) => 
        !lastFiles[index] || 
        file.id !== lastFiles[index].id ||
        file.uploaded !== lastFiles[index].uploaded ||
        file.path !== lastFiles[index].path
      );

    if (hasChanged) {
      console.log('Files changed, notifying parent:', currentFiles.length);
      lastNotifiedFiles.current = [...currentFiles];
      onFilesChange?.(currentFiles);
    }
  }, [completedFiles, onFilesChange]);

  // Notify upload status changes
  React.useEffect(() => {
    onUploadStatusChange?.(isUploading);
  }, [isUploading, onUploadStatusChange]);

  // Notify file changes
  React.useEffect(() => {
    notifyFilesChange();
  }, [notifyFilesChange]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) {
      console.warn('Maximum file limit reached');
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    uploadFiles(filesToUpload);
  }, [uploadFiles, files.length, maxFiles]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFileSelect(selectedFiles);
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (filename: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          isUploading && "opacity-60 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center space-y-4">
          <Upload className={cn(
            "mx-auto h-8 w-8 transition-colors",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isMobile ? "Tap to select files" : "Drop files here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images, PDF, and documents • Max {maxFiles} files
              {isMobile && " • Images will be compressed for mobile"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || files.length >= maxFiles}
            className="h-8"
          >
            {isUploading ? 'Uploading...' : 'Choose Files'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Progress & File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {/* Overall Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{completedFiles.length} / {files.length}</span>
              </div>
              <Progress 
                value={(completedFiles.length / files.length) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* File List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center gap-3">
                  {/* File Icon/Thumbnail */}
                  <div className="flex-shrink-0">
                    {file.uploaded && file.url && isImage(file.name) ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : isImage(file.name) ? (
                      <Image className="w-10 h-10 text-muted-foreground" />
                    ) : (
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {!file.uploaded && !file.error && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {file.uploaded && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    
                    {file.error && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {file.error && (
                  <p className="text-xs text-destructive mt-2 truncate">
                    {file.error}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Summary */}
          {(hasFailures || completedFiles.length > 0) && (
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>{completedFiles.length} uploaded</span>
              {hasFailures && (
                <span className="text-destructive">
                  {failedFiles.length} failed
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedFileUpload;