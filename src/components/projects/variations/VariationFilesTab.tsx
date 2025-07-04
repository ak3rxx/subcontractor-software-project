
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { useVariationFileManagement } from '@/hooks/useVariationFileManagement';
import { useSimplePermissions } from '@/hooks/useSimplePermissions';

interface VariationFilesTabProps {
  variation: any;
  isEditing: boolean;
  isBlocked?: boolean;
}

const VariationFilesTab: React.FC<VariationFilesTabProps> = ({
  variation,
  isEditing,
  isBlocked = false
}) => {
  const { 
    fetchFiles, 
    uploadFile, 
    deleteFile, 
    getFiles, 
    uploading 
  } = useVariationFileManagement();
  
  const { canEdit } = useSimplePermissions();
  const { user } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';
  const canUploadFiles = (isDeveloper() || canEdit('variations')) && !isBlocked;

  const { files, loading } = getFiles(variation?.id);

  useEffect(() => {
    if (variation?.id) {
      fetchFiles(variation.id);
    }
  }, [variation?.id, fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked || !variation?.id) {
      console.log('File upload blocked due to variation status or missing ID');
      return;
    }

    const fileList = Array.from(event.target.files || []);
    
    for (const file of fileList) {
      await uploadFile(variation.id, file);
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleDeleteFile = async (fileId: string) => {
    if (isBlocked || !variation?.id) {
      console.log('File deletion blocked due to variation status');
      return;
    }

    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteFile(variation.id, fileId);
    }
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
      {/* Upload Section */}
      {canUploadFiles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls"
                disabled={uploading || isBlocked}
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading files...
                </div>
              )}
              {isBlocked && (
                <p className="text-xs text-amber-600">
                  File uploads are restricted while the variation is in its current status.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Supported formats: PDF, Word documents, Images, Excel files
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attached Files
            {files.length > 0 && (
              <Badge variant="outline">{files.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading files...</span>
            </div>
          ) : files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{file.file_name}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.file_size)} • 
                        Uploaded {new Date(file.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Download file:', file.file_name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canUploadFiles && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={isBlocked}
                      >
                        <Trash2 className="h-4 w-4" />
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
              <p className="text-sm">
                {isBlocked 
                  ? 'File uploads are restricted for this variation status' 
                  : 'Upload files to support this variation'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>File Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Include supporting documentation such as quotes, specifications, or drawings</p>
          <p>• Ensure file names are descriptive and professional</p>
          <p>• Maximum file size: 10MB per file</p>
          <p>• All uploaded files will be logged in the audit trail</p>
          {isBlocked && (
            <p className="text-amber-600 font-medium">
              • File operations are currently restricted due to variation status
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationFilesTab;
