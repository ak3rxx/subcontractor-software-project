
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Image, AlertCircle, Lock } from 'lucide-react';
import { useSupabaseFileUpload, SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { useToast } from '@/hooks/use-toast';

interface SupabaseFileUploadEnhancedProps {
  files: SupabaseUploadedFile[];
  onFilesChange: (files: SupabaseUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  label?: string;
  accept?: string;
  maxFiles?: number;
  inspectionId?: string | null;
  checklistItemId?: string;
  disabled?: boolean;
}

const SupabaseFileUploadEnhanced: React.FC<SupabaseFileUploadEnhancedProps> = ({
  files,
  onFilesChange,
  onUploadStatusChange,
  label = "Upload Files",
  accept = "*/*",
  maxFiles = 10,
  inspectionId,
  checklistItemId,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  
  const {
    uploadFiles,
    deleteFile,
    isUploading,
    uploadProgress,
    uploadError
  } = useSupabaseFileUpload({
    bucket: 'qainspectionfiles',
    basePath: inspectionId ? `inspections/${inspectionId}${checklistItemId ? `/checklist/${checklistItemId}` : ''}` : 'temp'
  });

  // Update parent about upload status
  React.useEffect(() => {
    onUploadStatusChange?.(isUploading, !!uploadError);
  }, [isUploading, uploadError, onUploadStatusChange]);

  const handleFileSelect = useCallback(async (selectedFiles: File[]) => {
    if (disabled) return;
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    try {
      const uploadedFiles = await uploadFiles(selectedFiles);
      const newFiles = [...files, ...uploadedFiles];
      onFilesChange(newFiles);
      
      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    }
  }, [files, uploadFiles, onFilesChange, maxFiles, toast, disabled]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    event.target.value = '';
  };

  const handleDrop = useCallback((event: React.DragEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect, disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragOver(false);
  }, [disabled]);

  const handleRemoveFile = async (fileToRemove: SupabaseUploadedFile) => {
    if (disabled) return;
    
    try {
      await deleteFile(fileToRemove.path);
      const updatedFiles = files.filter(file => file.id !== fileToRemove.id);
      onFilesChange(updatedFiles);
      
      toast({
        title: "File removed",
        description: `${fileToRemove.name} has been removed`
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to remove file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{label}</span>
          {disabled && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Read Only
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!disabled && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById(`file-input-${checklistItemId || 'default'}`)?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Maximum {maxFiles} files • {accept}
            </p>
            
            <input
              id={`file-input-${checklistItemId || 'default'}`}
              type="file"
              multiple
              accept={accept}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading || disabled}
            />
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{uploadError}</span>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Uploaded Files ({files.length})
              </span>
              <Badge variant="outline" className="text-xs">
                {files.length}/{maxFiles}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(file.name)}
                    <span className="text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(file)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {disabled && files.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No files uploaded yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseFileUploadEnhanced;
