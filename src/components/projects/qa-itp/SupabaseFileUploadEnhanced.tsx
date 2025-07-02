import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, FileText, Image, Download, AlertCircle, CheckCircle, RotateCcw, Plus } from 'lucide-react';
import { useSupabaseFileUpload, SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { cn } from '@/lib/utils';

interface SupabaseFileUploadEnhancedProps {
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

const SupabaseFileUploadEnhanced: React.FC<SupabaseFileUploadEnhancedProps> = ({
  onFilesChange,
  onUploadStatusChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 5,
  className = "",
  label = "Upload Files",
  files = [],
  inspectionId,
  checklistItemId
}) => {
  const { uploadFiles, uploading, hasUploadFailures, removeFile, retryFailedUpload } = useSupabaseFileUpload();
  const [currentFiles, setCurrentFiles] = useState<SupabaseUploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

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
  }, [retryFailedUpload, inspectionId, checklistItemId]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragActive(false);

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

  // Get failed files for display
  const failedFiles = currentFiles.filter(f => !f.uploaded);
  const canUploadMore = currentFiles.length < maxFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced Drop Zone */}
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out",
          isDragOver 
            ? "border-primary bg-primary/10 shadow-lg scale-[1.02]" 
            : isDragActive
              ? "border-primary/70 bg-primary/5"
              : uploading || !canUploadMore
                ? "border-muted-foreground/30 bg-muted/30" 
                : "border-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5",
          canUploadMore ? "cursor-pointer" : "cursor-not-allowed"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <div className={cn(
            "mx-auto h-12 w-12 mb-4 transition-all duration-200",
            isDragOver ? "text-primary scale-110" : "text-muted-foreground"
          )}>
            {isDragOver ? (
              <Plus className="h-12 w-12" />
            ) : (
              <Upload className="h-12 w-12" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className={cn(
              "text-sm font-medium transition-colors",
              isDragOver ? "text-primary" : "text-foreground"
            )}>
              {isDragOver 
                ? 'Drop files here!' 
                : canUploadMore
                  ? 'Drag & drop files here or click to browse'
                  : `Maximum ${maxFiles} files reached`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {canUploadMore && (
                <>
                  {maxFiles - currentFiles.length} of {maxFiles} slots available • Accepts {accept}
                </>
              )}
            </p>
          </div>

          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || !canUploadMore}
            style={{ pointerEvents: isDragOver ? 'none' : 'auto' }}
          />

          {canUploadMore && (
            <Button
              variant={isDragOver ? "default" : "outline"}
              className="mt-4 pointer-events-none relative z-10 transition-all"
              disabled={uploading || !canUploadMore}
            >
              {uploading ? 'Uploading...' : isDragOver ? 'Drop files here!' : 'Choose Files'}
            </Button>
          )}
        </div>

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3 text-primary">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-sm font-medium">Uploading files...</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Failures */}
      {failedFiles.length > 0 && (
        <Card className="p-3 border-destructive bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Upload Failures:</p>
              <div className="mt-2 space-y-2">
                {failedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-background rounded p-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.error}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetryUpload(file.id)}
                      className="text-destructive hover:text-destructive/80 h-6 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Files List */}
      {currentFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {label} ({currentFiles.length}/{maxFiles})
            </h4>
            {currentFiles.some(f => f.uploaded) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-600" />
                {currentFiles.filter(f => f.uploaded).length} uploaded
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            {currentFiles.map((file) => (
              <Card key={file.id} className={cn(
                "p-3 transition-colors",
                isPDF(file) ? 'border-amber-200 bg-amber-50' : 
                file.uploaded ? 'border-green-200 bg-green-50' : 
                'border-destructive bg-destructive/5'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {isImage(file) && file.uploaded ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load image:', file.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <FileText className={cn(
                          "h-5 w-5",
                          isPDF(file) ? 'text-amber-600' : 'text-muted-foreground'
                        )} />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                        {isPDF(file) && <span className="ml-2 text-xs text-amber-600">(PDF)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.uploaded && <CheckCircle className="h-3 w-3 text-green-600" />}
                        {!file.uploaded && file.error && (
                          <span className="text-destructive">{file.error}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {file.uploaded ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="text-primary hover:text-primary/80 h-8 w-8 p-0"
                        title="Open file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryUpload(file.id)}
                        className="text-primary hover:text-primary/80 h-8 w-8 p-0"
                        title="Retry upload"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseFileUploadEnhanced;