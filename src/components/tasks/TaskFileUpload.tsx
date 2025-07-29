import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedFileUpload } from '@/hooks/useEnhancedFileUpload';
import { Upload, Download, Trash2, FileText, Image, File, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskFileUploadProps {
  taskId: string;
  projectId: string;
  existingFiles?: any[];
  isEditing: boolean;
  onFilesChange?: (files: any[]) => void;
}

export const TaskFileUpload: React.FC<TaskFileUploadProps> = ({
  taskId,
  projectId,
  existingFiles = [],
  isEditing,
  onFilesChange
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const { toast } = useToast();

  const {
    files,
    isUploading,
    uploadFiles,
    removeFile,
    clearFiles,
  } = useEnhancedFileUpload({
    bucket: 'taskfiles',
    inspectionId: taskId, // Using inspectionId for taskId compatibility
    maxRetries: 3,
    enableOfflineQueue: true
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const newFiles = Array.from(fileList);
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      await uploadFiles(validFiles);
      // Don't call onFilesChange during upload to prevent state conflicts
    }

    // Reset input
    event.target.value = '';
  }, [uploadFiles, toast]);

  // FIXED: Sync uploaded files back to parent when upload completes
  useEffect(() => {
    const uploadedFiles = files.filter(f => f.uploaded);
    if (uploadedFiles.length > 0 && onFilesChange) {
      onFilesChange(uploadedFiles);
    }
  }, [files, onFilesChange]);

  const handleFileRemove = useCallback(async (fileId: string, fileName: string) => {
    await removeFile(fileId);
    // Update parent state after removal
    if (onFilesChange) {
      const remainingFiles = files.filter(f => f.id !== fileId && f.uploaded);
      onFilesChange(remainingFiles);
    }
    toast({
      title: "File removed",
      description: `${fileName} has been removed`
    });
  }, [removeFile, files, onFilesChange, toast]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'text-green-600';
    if (fileType.includes('pdf')) return 'text-red-600';
    if (fileType.includes('document') || fileType.includes('word')) return 'text-blue-600';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'text-green-700';
    return 'text-gray-600';
  };

  const allFiles = [...existingFiles, ...files];

  const handleBulkDelete = useCallback(async () => {
    for (const fileId of selectedFiles) {
      const file = allFiles.find(f => f.id === fileId);
      if (file) {
        await removeFile(fileId);
      }
    }
    setSelectedFiles([]);
    // Update parent state after bulk removal
    if (onFilesChange) {
      const remainingFiles = files.filter(f => !selectedFiles.includes(f.id) && f.uploaded);
      onFilesChange(remainingFiles);
    }
    toast({
      title: "Files removed",
      description: `${selectedFiles.length} file(s) removed`
    });
  }, [selectedFiles, allFiles, removeFile, files, onFilesChange, toast]);

  return (
    <div className="space-y-4">
      {/* Upload Area - Only show in edit mode */}
      {isEditing && (
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Files</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop files here, or click to browse
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 50MB. Supported: PDF, DOC, XLS, Images
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      {isEditing && selectedFiles.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedFiles.length} file(s) selected
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Files</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedFiles.length} selected file(s)? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Files List */}
      {allFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Attached Files ({allFiles.length})
          </h4>
          <div className="space-y-2">
            {allFiles.map((file: any) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {isEditing && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(prev => [...prev, file.id]);
                          } else {
                            setSelectedFiles(prev => prev.filter(id => id !== file.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    )}
                    
                    <div className={`${getFileTypeColor(file.type || 'application/octet-stream')}`}>
                      {getFileIcon(file.type || 'application/octet-stream')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name || file.file_name || `File ${file.id.slice(0, 8)}`}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {file.size && (
                          <span>{Math.round(file.size / 1024)}KB</span>
                        )}
                        {file.uploaded_at && (
                          <span>• {format(new Date(file.uploaded_at), 'MMM d, yyyy')}</span>
                        )}
                        {file.status && (
                          <Badge variant={file.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {file.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Preview button for images */}
                    {file.type?.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Download button */}
                    {file.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}

                    {/* Delete button - only in edit mode */}
                    {isEditing && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name || file.file_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleFileRemove(file.id, file.name || file.file_name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {/* Upload progress */}
                {file.progress !== undefined && file.progress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading... {file.progress}%
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <AlertDialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{previewFile.name || previewFile.file_name}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex justify-center">
              <img 
                src={previewFile.url} 
                alt={previewFile.name || previewFile.file_name}
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction asChild>
                <a href={previewFile.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};