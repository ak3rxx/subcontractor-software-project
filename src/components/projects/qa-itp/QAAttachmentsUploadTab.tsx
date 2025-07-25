import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Trash2 } from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedFileUpload } from '@/hooks/useEnhancedFileUpload';
import MobileOptimizedFileUpload from './MobileOptimizedFileUpload';
import FileThumbnailViewer from './FileThumbnailViewer';
import FieldAuditNote from './FieldAuditNote';

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
  const { changeHistory, recordChange } = useQAChangeHistory(inspection?.id);
  const { toast } = useToast();
  
  // Enhanced file upload with offline support and retry logic
  const { setupNetworkMonitoring } = useEnhancedFileUpload({
    bucket: 'qainspectionfiles',
    inspectionId: inspection?.id || 'temp',
    checklistItemId: 'general',
    maxRetries: 2,
    enableOfflineQueue: true
  });

  // Setup network monitoring
  useEffect(() => {
    const cleanup = setupNetworkMonitoring();
    return cleanup;
  }, [setupNetworkMonitoring]);

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

  const handleFilesUploaded = async (uploadedFiles: any[]) => {
    const successfulUploads = uploadedFiles
      .filter(f => f.uploaded && f.path)
      .map(f => f.path);
    
    if (successfulUploads.length > 0) {
      const updatedFiles = [...allFiles, ...successfulUploads];
      setAllFiles(updatedFiles);
      
      // Record attachment changes for audit trail
      if (recordChange && inspection?.id) {
        for (const filePath of successfulUploads) {
          const fileName = filePath.split('/').pop();
          await recordChange(
            'attachments',
            null,
            `Uploaded attachment: ${fileName}`,
            'create'
          );
        }
      }
      
      // Notify parent modal about attachment changes
      onAttachmentChange?.(updatedFiles);
      toast({
        title: "Success",
        description: `${successfulUploads.length} file(s) uploaded successfully`
      });
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Attachments</span>
            <span className="text-sm text-muted-foreground">
              {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* File Upload Section - Mobile Optimized */}
          {isEditing && (
            <MobileOptimizedFileUpload
              onFilesChange={handleFilesUploaded}
              accept="image/*,.pdf,.doc,.docx"
              multiple={true}
              maxFiles={10}
              className="w-full"
              inspectionId={inspection?.id}
            />
          )}

          {/* Files Display with Fixed Scroll Performance */}
          {allFiles.length > 0 ? (
            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(100vh - 400px)' }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-2" style={{ minHeight: 'min-content' }}>
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
                    className="relative group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={() => handleFileClick(filePath)}
                  >
                    <div className="aspect-square bg-muted/30">
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
          
           {/* Audit Trail for Attachments */}
           <FieldAuditNote 
             fieldName="attachments" 
             changeHistory={changeHistory.filter(ch => ch.field_name === 'attachments')}
             className="mt-4"
           />
        </CardContent>
      </Card>
    </div>
  );
};

export default QAAttachmentsUploadTab;