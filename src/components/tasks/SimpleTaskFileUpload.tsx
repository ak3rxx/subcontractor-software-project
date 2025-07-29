import React, { useState, useRef } from 'react';
import { useSimpleFileUpload } from '@/hooks/useSimpleFileUpload';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SimpleTaskFileUploadProps {
  taskId: string;
  projectId: string;
  existingFiles?: any[];
  isEditing: boolean;
  onFilesChange?: (files: any[]) => void;
}

const SimpleTaskFileUpload: React.FC<SimpleTaskFileUploadProps> = ({
  taskId,
  projectId,
  existingFiles = [],
  isEditing,
  onFilesChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const { toast } = useToast();

  const {
    files: uploadedFiles,
    isUploading,
    uploadFiles,
    removeFile,
    retryUpload,
    clearFiles
  } = useSimpleFileUpload({
    bucket: 'taskfiles',
    inspectionId: taskId,
    checklistItemId: projectId
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Validate file size (10MB limit)
    const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Files must be under 10MB. ${oversizedFiles.length} file(s) exceeded this limit.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const uploaded = await uploadFiles(selectedFiles);
      if (onFilesChange && uploaded.length > 0) {
        const allFiles = [...existingFiles, ...uploaded.filter(f => f.uploaded)];
        onFilesChange(allFiles);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    await removeFile(fileId);
    
    // Update parent component
    if (onFilesChange) {
      const remainingUploaded = uploadedFiles.filter(f => f.id !== fileId && f.uploaded);
      const allFiles = [...existingFiles, ...remainingUploaded];
      onFilesChange(allFiles);
    }
  };

  const handleRemoveExistingFile = (fileIndex: number) => {
    if (onFilesChange) {
      const updatedExisting = existingFiles.filter((_, index) => index !== fileIndex);
      const completedUploaded = uploadedFiles.filter(f => f.uploaded);
      onFilesChange([...updatedExisting, ...completedUploaded]);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'bg-blue-100 text-blue-800';
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const allFiles = [...existingFiles, ...uploadedFiles.filter(f => f.uploaded)];
  const uploadingFiles = uploadedFiles.filter(f => !f.uploaded);

  return (
    <div className="space-y-4">
      {/* Upload Area - Only show in edit mode */}
      {isEditing && (
        <Card className="border-2 border-dashed border-muted-foreground/25 p-6">
          <div className="text-center space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload files</p>
                <p className="text-xs text-muted-foreground">
                  Click to browse or drag files here (Max 10MB)
                </p>
              </div>
            </div>
            
            <Button 
              type="button"
              variant="outline" 
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              Choose Files
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Uploading files...</h4>
          <div className="space-y-3">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {file.error ? 'Failed' : `${file.progress || 0}%`}
                  </span>
                </div>
                <Progress value={file.progress || 0} className="h-2" />
                {file.error && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-destructive">Upload failed</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryUpload(file.id)}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* File List */}
      {allFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-3">Attached Files</h4>
          <div className="space-y-2">
            {allFiles.map((file, index) => (
              <div key={file.id || `existing-${index}`} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`p-1.5 rounded ${getFileTypeColor(file.type || file.file_type || '')}`}>
                    {getFileIcon(file.type || file.file_type || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.name || file.file_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size || file.file_size || 0)}</span>
                      {file.uploaded_at && (
                        <span>• {new Date(file.uploaded_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* Preview button for images */}
                  {isImage(file.type || file.file_type || '') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewFile(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Download button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const url = file.url || file.file_path;
                      if (url) {
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {/* Delete button - only in edit mode */}
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (file.id && uploadedFiles.find(f => f.id === file.id)) {
                          handleRemoveFile(file.id);
                        } else {
                          handleRemoveExistingFile(index);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name || previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewFile?.url || previewFile?.file_path}
              alt={previewFile?.name || previewFile?.file_name}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleTaskFileUpload;