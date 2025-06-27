import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, X, FileText, Image, FileIcon, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VariationFilesTabProps {
  variation: any;
  attachments: any[];
  attachmentsLoading: boolean;
  canEdit: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onDownload: (attachment: any) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

const VariationFilesTab: React.FC<VariationFilesTabProps> = ({
  variation,
  attachments,
  attachmentsLoading,
  canEdit,
  onUpload,
  onDownload,
  onDelete
}) => {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles([...uploadingFiles, ...files]);
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(uploadingFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(uploadingFiles);
      setUploadingFiles([]);
      toast({
        title: "Success",
        description: `${uploadingFiles.length} file(s) uploaded successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      await onDownload(attachment);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await onDelete(attachmentId);
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

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType?.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType?.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (fileType?.includes('pdf')) return 'bg-red-100 text-red-800';
    if (fileType?.includes('word')) return 'bg-blue-100 text-blue-800';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return 'bg-emerald-100 text-emerald-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, Word, Excel, Images (JPG, PNG, GIF, WebP)
              </p>
            </div>

            {uploadingFiles.length > 0 && (
              <div>
                <Label>Files to Upload</Label>
                <div className="space-y-2 mt-2">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : `Upload ${uploadingFiles.length} File(s)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attached Files
            {attachments.length > 0 && (
              <Badge variant="outline">{attachments.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachmentsLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading files...</span>
            </div>
          ) : attachments.length > 0 ? (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getFileIcon(attachment.file_type)}
                    <div className="flex-1">
                      <div className="font-medium">{attachment.file_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getFileTypeColor(attachment.file_type)}>
                          {attachment.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(attachment.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment)}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(attachment.id)}
                        title="Delete file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No files attached</p>
              {canEdit && (
                <p className="text-sm">Use the upload section above to add files</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Management Tips */}
      {canEdit && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2 text-blue-900">File Management Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload supporting documents, drawings, or specifications</li>
              <li>• Accepted formats: PDF, Word, Excel, and common image formats</li>
              <li>• Files are automatically organized and accessible to project team</li>
              <li>• Use descriptive filenames for better organization</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VariationFilesTab;
