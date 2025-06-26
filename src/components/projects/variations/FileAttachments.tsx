import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileAttachmentsProps {
  editingVariation?: any;
  attachments?: any[];
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  onDeleteAttachment?: (attachmentId: string) => Promise<void>;
  onDownloadAttachment?: (attachment: any) => Promise<void>;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({
  editingVariation,
  attachments,
  uploadedFiles,
  setUploadedFiles,
  onDeleteAttachment,
  onDownloadAttachment
}) => {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (onDeleteAttachment) {
      try {
        await onDeleteAttachment(attachmentId);
        toast({
          title: "Success",
          description: "Attachment deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete attachment",
          variant: "destructive"
        });
      }
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    if (onDownloadAttachment) {
      try {
        await onDownloadAttachment(attachment);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download attachment",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing attachments (when editing) */}
        {editingVariation && attachments && attachments.length > 0 && (
          <div>
            <Label>Existing Attachments</Label>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{attachment.file_name}</span>
                    <Badge variant="outline">{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                  <div className="flex gap-2">
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

        {/* New file uploads */}
        <div>
          <Label htmlFor="file-upload">Upload New Files</Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div>
            <Label>Files to Upload</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileAttachments;
