
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  Paperclip,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';

interface VariationFilesTabProps {
  variation: any;
  isEditing: boolean;
}

const VariationFilesTab: React.FC<VariationFilesTabProps> = ({
  variation,
  isEditing
}) => {
  const [dragOver, setDragOver] = useState(false);

  // Mock attachments data - in real implementation, this would come from variation.attachments
  const attachments = variation.attachments || [
    {
      id: '1',
      name: 'electrical_plan_rev2.pdf',
      size: 2.4 * 1024 * 1024,
      type: 'application/pdf',
      uploaded_by: 'John Smith',
      uploaded_at: '2024-01-15T10:30:00Z',
      url: '#'
    },
    {
      id: '2',
      name: 'site_photo_001.jpg',
      size: 1.8 * 1024 * 1024,
      type: 'image/jpeg',
      uploaded_by: 'Jane Doe',
      uploaded_at: '2024-01-16T14:20:00Z',
      url: '#'
    },
    {
      id: '3',
      name: 'specification_update.docx',
      size: 0.9 * 1024 * 1024,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploaded_by: 'Mike Johnson',
      uploaded_at: '2024-01-17T09:15:00Z',
      url: '#'
    }
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeBadge = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Badge variant="secondary" className="text-xs">Image</Badge>;
    }
    if (fileType === 'application/pdf') {
      return <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">PDF</Badge>;
    }
    if (fileType.includes('word') || fileType.includes('document')) {
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Document</Badge>;
    }
    return <Badge variant="outline" className="text-xs">File</Badge>;
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file drop - in real implementation
    console.log('Files dropped:', e.dataTransfer.files);
  };

  const handleFileUpload = () => {
    // Trigger file input - in real implementation
    console.log('File upload triggered');
  };

  const handleViewFile = (attachment: any) => {
    // Open file viewer - in real implementation
    console.log('Viewing file:', attachment.name);
  };

  const handleDownloadFile = (attachment: any) => {
    // Download file - in real implementation
    console.log('Downloading file:', attachment.name);
  };

  const handleDeleteFile = (attachment: any) => {
    // Delete file - in real implementation
    console.log('Deleting file:', attachment.name);
  };

  const totalFileSize = attachments.reduce((sum, file) => sum + file.size, 0);

  return (
    <ScrollArea className="h-[calc(100vh-400px)] pr-4">
      <div className="space-y-6">
        {/* File Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              File Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {attachments.length}
                </div>
                <div className="text-sm text-blue-800">Total Files</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatFileSize(totalFileSize)}
                </div>
                <div className="text-sm text-green-800">Total Size</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {attachments.filter(f => f.type.startsWith('image/')).length}
                </div>
                <div className="text-sm text-purple-800">Images</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Area (only in edit mode) */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Files
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <Button onClick={handleFileUpload} className="mb-2">
                  Browse Files
                </Button>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB each)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File List */}
        <Card>
          <CardHeader>
            <CardTitle>Attached Files</CardTitle>
          </CardHeader>
          <CardContent>
            {attachments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <File className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files attached</h3>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Upload files to attach them to this variation.' : 'No files have been attached to this variation.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(attachment.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.name}
                          </p>
                          {getFileTypeBadge(attachment.type)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(attachment.size)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {attachment.uploaded_by}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(attachment.uploaded_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFile(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(attachment)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Management Guidelines */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">File Management Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-medium">Recommended file types:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Technical drawings: PDF, DWG</li>
                <li>Photographs: JPG, PNG</li>
                <li>Documents: PDF, DOC, DOCX</li>
                <li>Specifications: PDF, TXT</li>
              </ul>
              <p className="font-medium mt-4">Best practices:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use descriptive file names</li>
                <li>Keep file sizes under 10MB when possible</li>
                <li>Upload high-resolution images for technical details</li>
                <li>Include revision numbers in file names</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default VariationFilesTab;
