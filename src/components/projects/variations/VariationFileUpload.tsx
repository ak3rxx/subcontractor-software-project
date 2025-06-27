import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Download, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseFileUpload } from '@/hooks/useSupabaseFileUpload';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';

interface VariationFileUploadProps {
  variationId?: string;
  onFilesChange?: (files: any[]) => void;
}

const VariationFileUpload: React.FC<VariationFileUploadProps> = ({
  variationId,
  onFilesChange
}) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  
  const {
    uploadedFiles,
    uploading,
    hasUploadFailures,
    uploadFile,
    removeFile,
    retryFailedUpload
  } = useSupabaseFileUpload({
    bucket: 'variation-attachments',
    folder: variationId ? `${variationId}` : undefined
  });

  const {
    attachments,
    loading: attachmentsLoading,
    downloadAttachment,
    deleteAttachment,
    fetchAttachments
  } = useVariationAttachments(variationId);

  // Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      await handleFileUpload(files);
    }
  }, [variationId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFileUpload(files);
    }
  }, [variationId]);

  const handleFileUpload = async (files: File[]) => {
    if (!variationId) {
      toast({
        title: "Error",
        description: "Please save the variation first before uploading files",
        variant: "destructive"
      });
      return;
    }

    for (const file of files) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        continue;
      }

      await uploadFile(file);
    }

    // Refresh attachments after upload
    if (fetchAttachments) {
      await fetchAttachments();
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      await downloadAttachment(attachment);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls"
          />
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Drop files here or click to select
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports: PDF, Word, Excel, Images (max 10MB each)
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Uploading files...
          </div>
        )}

        {/* Upload Failures */}
        {hasUploadFailures && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Some files failed to upload. Check the list below.
          </div>
        )}

        {/* Uploaded Files (Pending) */}
        {uploadedFiles.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Recently Uploaded</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div>
                      <span className="text-sm font-medium">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                        {file.uploaded ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Uploaded</Badge>
                        ) : file.error ? (
                          <Badge variant="destructive" className="text-xs">Failed</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Uploading...</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {file.error && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => retryFailedUpload(file.id)}
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Attachments */}
        {attachments && attachments.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Saved Attachments</h4>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
                    <div>
                      <span className="text-sm font-medium">{attachment.file_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(attachment.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!attachmentsLoading && (!attachments || attachments.length === 0) && uploadedFiles.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No files attached yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationFileUpload;
