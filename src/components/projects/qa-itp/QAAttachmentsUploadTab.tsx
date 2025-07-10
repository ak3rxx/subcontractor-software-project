import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useToast } from '@/hooks/use-toast';
import SupabaseFileUpload from './SupabaseFileUpload';
import FileThumbnailViewer from './FileThumbnailViewer';

interface QAAttachmentsUploadTabProps {
  inspection: any;
  isEditing: boolean;
  onAttachmentChange?: (files: string[]) => void;
}

const QAAttachmentsUploadTab: React.FC<QAAttachmentsUploadTabProps> = ({
  inspection,
  isEditing,
  onAttachmentChange
}) => {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { getChecklistItems } = useQAInspectionsSimple();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllFiles = async () => {
      if (inspection?.id) {
        try {
          const items = await getChecklistItems(inspection.id);
          const files: string[] = [];
          items.forEach(item => {
            if (item.evidence_files && Array.isArray(item.evidence_files)) {
              files.push(...item.evidence_files);
            }
          });
          setAllFiles(files);
        } catch (error) {
          console.error('Error fetching inspection files:', error);
        }
      }
    };

    fetchAllFiles();
  }, [inspection?.id, getChecklistItems]);

  const handleFileClick = (filePath: string) => {
    const fileUrl = filePath.startsWith('http') 
      ? filePath 
      : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
    window.open(fileUrl, '_blank');
  };

  const handleFilesUploaded = (uploadedFiles: any[]) => {
    const successfulUploads = uploadedFiles
      .filter(f => f.uploaded && f.path)
      .map(f => f.path);
    
    if (successfulUploads.length > 0) {
      const updatedFiles = [...allFiles, ...successfulUploads];
      setAllFiles(updatedFiles);
      // Notify parent modal about attachment changes
      onAttachmentChange?.(updatedFiles);
      toast({
        title: "Success",
        description: `${successfulUploads.length} file(s) uploaded successfully`
      });
    }
  };

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Attachments</span>
            <span className="text-sm text-muted-foreground">
              {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Section */}
          {isEditing && (
            <div className="border-2 border-dashed border-muted rounded-lg p-4">
              <SupabaseFileUpload
                onFilesChange={handleFilesUploaded}
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
                maxFiles={10}
                className="w-full"
                label="Upload Additional Files"
                inspectionId={inspection?.id}
              />
            </div>
          )}

          {/* Files Display */}
          {allFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allFiles.map((filePath, index) => {
                const fileName = filePath.split('/').pop() || `File ${index + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const isPDF = fileName.toLowerCase().endsWith('.pdf');
                const fileUrl = filePath.startsWith('http') 
                  ? filePath 
                  : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
                
                return (
                  <Card 
                    key={index} 
                    className="relative group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleFileClick(filePath)}
                  >
                    <div className="aspect-square">
                      {isImage ? (
                        <img
                          src={fileUrl}
                          alt={fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          {isPDF ? (
                            <FileText className="h-8 w-8 text-red-600" />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay with filename and actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="text-white text-xs font-medium truncate">
                          {fileName}
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-white hover:bg-white/20 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFileClick(filePath);
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attachments found</p>
              {isEditing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Use the upload area above to add files
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAAttachmentsUploadTab;