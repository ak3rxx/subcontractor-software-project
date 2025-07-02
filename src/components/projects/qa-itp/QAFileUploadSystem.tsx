import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Image, AlertCircle, Lock, Download, Eye } from 'lucide-react';
import { useSupabaseFileUpload, SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QAFileUploadSystemProps {
  files: SupabaseUploadedFile[];
  onFilesChange: (files: SupabaseUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  label?: string;
  accept?: string;
  maxFiles?: number;
  inspectionId?: string | null;
  checklistItemId?: string;
  disabled?: boolean;
  showThumbnails?: boolean;
}

const QAFileUploadSystem: React.FC<QAFileUploadSystemProps> = ({
  files,
  onFilesChange,
  onUploadStatusChange,
  label = "Upload Files",
  accept = "image/*,.pdf,.doc,.docx",
  maxFiles = 10,
  inspectionId,
  checklistItemId,
  disabled = false,
  showThumbnails = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<SupabaseUploadedFile | null>(null);
  const { toast } = useToast();
  
  const {
    uploading,
    hasUploadFailures,
    uploadFiles,
    removeFile
  } = useSupabaseFileUpload({
    bucket: 'qainspectionfiles'
  });

  // Update parent about upload status
  React.useEffect(() => {
    onUploadStatusChange?.(uploading, hasUploadFailures);
  }, [uploading, hasUploadFailures, onUploadStatusChange]);

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
      console.log('Starting file upload for files:', selectedFiles);
      const uploadedFiles = await uploadFiles(selectedFiles, inspectionId || undefined, checklistItemId);
      
      if (uploadedFiles.length > 0) {
        const newFiles = [...files, ...uploadedFiles];
        onFilesChange(newFiles);
        
        toast({
          title: "Success",
          description: `${uploadedFiles.length} file(s) uploaded successfully`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    }
  }, [files, uploadFiles, onFilesChange, maxFiles, toast, disabled, inspectionId, checklistItemId]);

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
      await removeFile(fileToRemove.id);
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

  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const handlePreviewFile = (file: SupabaseUploadedFile) => {
    if (isImageFile(file.name)) {
      setPreviewFile(file);
    } else {
      window.open(file.url, '_blank');
    }
  };

  return (
    <>
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
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById(`file-input-${checklistItemId || 'default'}`)?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
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
                disabled={uploading || disabled}
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading files...</span>
              </div>
              <Progress value={0} className="w-full" />
            </div>
          )}

          {/* Upload Error */}
          {hasUploadFailures && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">Some files failed to upload</span>
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
              
              {showThumbnails && files.some(f => isImageFile(f.name)) ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {files.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <div className="aspect-square relative group">
                        {isImageFile(file.name) ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handlePreviewFile(file)}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted cursor-pointer" onClick={() => handlePreviewFile(file)}>
                            {getFileIcon(file.name)}
                          </div>
                        )}
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewFile(file);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-white hover:bg-white/20 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {!disabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-300 hover:text-red-200 hover:bg-red-500/20 h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(file);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
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
                          onClick={() => handlePreviewFile(file)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
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
              )}
            </div>
          )}

          {disabled && files.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No files uploaded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewFile && isImageFile(previewFile.name) && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default QAFileUploadSystem;