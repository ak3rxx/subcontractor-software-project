import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, X, FileText, Image, Download, AlertCircle, CheckCircle, 
  RotateCcw, Pause, Play, Trash2, ImageIcon, FileIcon
} from 'lucide-react';
import { useQAUploadManager, QAUploadedFile } from '@/hooks/useQAUploadManager';
import { cn } from '@/lib/utils';

interface EnhancedFileUploadProps {
  onFilesChange?: (files: QAUploadedFile[]) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  inspectionId?: string;
  checklistItemId?: string;
  enableBulkUpload?: boolean;
  enableAutoSave?: boolean;
  showAnalytics?: boolean;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFilesChange,
  onUploadStatusChange,
  accept = "*/*",
  multiple = true,
  maxFiles = 15,
  className = "",
  label = "Upload Files",
  inspectionId,
  checklistItemId,
  enableBulkUpload = true,
  enableAutoSave = true,
  showAnalytics = false
}) => {
  const uploadManager = useQAUploadManager({
    enableAutoSave,
    maxConcurrentUploads: enableBulkUpload ? 5 : 2
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of changes
  React.useEffect(() => {
    onFilesChange?.(uploadManager.uploadedFiles);
    onUploadStatusChange?.(uploadManager.isUploading, uploadManager.hasFailures);
  }, [uploadManager.uploadedFiles, uploadManager.isUploading, uploadManager.hasFailures, onFilesChange, onUploadStatusChange]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    // Check file limit
    if (uploadManager.uploadedFiles.length + selectedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    uploadManager.queueFiles(selectedFiles, inspectionId, checklistItemId);
    
    // Reset input
    event.target.value = '';
  }, [uploadManager, maxFiles, inspectionId, checklistItemId]);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Check file limit
    if (uploadManager.uploadedFiles.length + droppedFiles.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    uploadManager.queueFiles(droppedFiles, inspectionId, checklistItemId);
  }, [uploadManager, maxFiles, inspectionId, checklistItemId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: QAUploadedFile) => file.type.startsWith('image/');
  const isPDF = (file: QAUploadedFile) => file.type === 'application/pdf';

  // Group files by status
  const uploadingFiles = uploadManager.uploadedFiles.filter(f => !f.uploaded && !f.error);
  const successFiles = uploadManager.completedFiles;
  const failedFiles = uploadManager.failedFiles;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 relative",
          isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : uploadManager.isUploading
              ? 'border-blue-300 bg-blue-50/50' 
              : uploadManager.uploadedFiles.length >= maxFiles
                ? 'border-muted-foreground/30 bg-muted/30' 
                : 'border-muted-foreground/50 hover:border-primary/50 hover:bg-primary/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={cn(
          "mx-auto h-12 w-12 mb-4 transition-colors",
          isDragOver ? 'text-primary animate-bounce' : 'text-muted-foreground'
        )} />
        
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          )}>
            {isDragOver ? 'Drop files here!' : 'Drop files here or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} files • Accepts {accept}
            {enableBulkUpload && ' • Bulk upload supported'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadManager.isUploading || uploadManager.uploadedFiles.length >= maxFiles}
        />

        <Button
          variant="outline"
          className="mt-4 pointer-events-none relative z-10"
          disabled={uploadManager.isUploading || uploadManager.uploadedFiles.length >= maxFiles}
        >
          {uploadManager.isUploading ? 'Uploading...' : isDragOver ? 'Drop files here!' : 'Choose Files'}
        </Button>
      </div>

      {/* Progress Overview */}
      {(uploadManager.isUploading || uploadManager.uploadQueue > 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Upload Progress</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {uploadManager.activeUploads} active • {uploadManager.uploadQueue} queued
                </Badge>
                {uploadManager.isPaused ? (
                  <Button size="sm" variant="ghost" onClick={uploadManager.resumeQueue}>
                    <Play className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={uploadManager.pauseQueue}>
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <Progress value={uploadManager.totalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {uploadManager.totalProgress.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upload Failures */}
      {failedFiles.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Upload Failures ({failedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {failedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between text-sm">
                  <span className="text-red-700 truncate flex-1">{file.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="destructive" className="text-xs">
                      {file.error}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => uploadManager.retryUpload(file.id)}
                      className="text-red-600 hover:text-red-800 h-6 px-2"
                      title="Retry upload"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      {showAnalytics && uploadManager.analytics.totalUploaded > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">Upload Analytics</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-green-600">Successful:</span>
                <span className="ml-1 font-medium">{uploadManager.analytics.totalUploaded}</span>
              </div>
              <div>
                <span className="text-red-600">Failed:</span>
                <span className="ml-1 font-medium">{uploadManager.analytics.totalFailed}</span>
              </div>
              <div>
                <span className="text-blue-600">Avg Time:</span>
                <span className="ml-1 font-medium">{(uploadManager.analytics.averageUploadTime / 1000).toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-purple-600">Last:</span>
                <span className="ml-1 font-medium">{(uploadManager.analytics.lastUploadTime / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {uploadManager.uploadedFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {label} ({uploadManager.uploadedFiles.length}/{maxFiles})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={uploadManager.clearAllFiles}
                className="text-red-500 hover:text-red-700"
                title="Clear all files"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {uploadManager.uploadedFiles.map((file) => (
                <div 
                  key={file.id} 
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    file.uploaded 
                      ? isPDF(file) 
                        ? 'border-amber-200 bg-amber-50' 
                        : 'border-green-200 bg-green-50'
                      : file.error 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* File Icon/Thumbnail */}
                    <div className="flex-shrink-0">
                      {isImage(file) && file.uploaded && file.thumbnailUrl ? (
                        <div className="relative w-10 h-10">
                          <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            className="w-full h-full object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <ImageIcon className="absolute inset-0 w-full h-full text-blue-500 bg-white rounded" />
                        </div>
                      ) : (
                        <div className={cn(
                          "w-10 h-10 rounded flex items-center justify-center",
                          isPDF(file) ? 'bg-amber-100' : 'bg-blue-100'
                        )}>
                          <FileText className={cn(
                            "h-5 w-5",
                            isPDF(file) ? 'text-amber-600' : 'text-blue-600'
                          )} />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        {isPDF(file) && (
                          <Badge variant="outline" className="text-xs">PDF</Badge>
                        )}
                        {file.uploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {file.error && <AlertCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.retryCount && file.retryCount > 0 && (
                          <span className="ml-2 text-orange-600">
                            • Retry {file.retryCount}
                          </span>
                        )}
                      </p>

                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                      
                      {!file.uploaded && !file.error && file.progress > 0 && (
                        <Progress value={file.progress} className="h-1 mt-1" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {file.uploaded && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(file.url, '_blank')}
                          className="text-blue-600 hover:text-blue-800 h-8 px-2"
                          title="Download/View"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {file.error && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => uploadManager.retryUpload(file.id)}
                          className="text-orange-600 hover:text-orange-800 h-8 px-2"
                          title="Retry upload"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => uploadManager.removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 h-8 px-2"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedFileUpload;