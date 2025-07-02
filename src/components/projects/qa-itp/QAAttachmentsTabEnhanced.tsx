
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Image, Trash2, Lock } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import DragDropFileUpload from './DragDropFileUpload';

interface QAAttachmentsTabEnhancedProps {
  inspection: any;
  isEditing: boolean;
  onAttachmentsChange?: (files: string[]) => void;
  recordChange?: (field: string, oldValue: string, newValue: string, changeType?: string, itemId?: string, itemDescription?: string) => void;
}

const QAAttachmentsTabEnhanced: React.FC<QAAttachmentsTabEnhancedProps> = ({
  inspection,
  isEditing,
  onAttachmentsChange,
  recordChange
}) => {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [inspectionFiles, setInspectionFiles] = useState<string[]>([]);
  const { getChecklistItems } = useQAInspections();

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
          // Also get inspection-level files if any
          setInspectionFiles(inspection.attachments || []);
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

  const handleInspectionFileUpload = (filePaths: string[]) => {
    if (!isEditing) return;
    
    const oldCount = inspectionFiles.length;
    const updatedFiles = [...inspectionFiles, ...filePaths];
    setInspectionFiles(updatedFiles);
    onAttachmentsChange?.(updatedFiles);

    // Record audit trail for file uploads
    if (recordChange) {
      recordChange(
        'inspection_attachments',
        `${oldCount} files`,
        `${updatedFiles.length} files`,
        'update',
        inspection?.id,
        'Inspection Level Attachments'
      );
    }
  };

  const handleRemoveFile = (fileToRemove: string) => {
    if (!isEditing) return;
    
    const oldCount = inspectionFiles.length;
    const updatedFiles = inspectionFiles.filter(file => file !== fileToRemove);
    setInspectionFiles(updatedFiles);
    onAttachmentsChange?.(updatedFiles);

    // Record audit trail for file removal
    if (recordChange) {
      recordChange(
        'inspection_attachments',
        `${oldCount} files`,
        `${updatedFiles.length} files`,
        'update',
        inspection?.id,
        'Inspection Level Attachments'
      );
    }
  };

  const allInspectionFiles = [...allFiles, ...inspectionFiles];

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropFileUpload
              onUpload={handleInspectionFileUpload}
              allowMultiple={true}
              acceptedTypes="image/*,.pdf,.doc,.docx,.xlsx,.dwg"
              showProgress={true}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Attachments ({allInspectionFiles.length})</span>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  <Lock className="h-3 w-3" />
                  Read Only
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implement bulk download
                  console.log('Bulk download not implemented yet');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardTitle>
          {!isEditing && (
            <p className="text-sm text-muted-foreground">
              Switch to edit mode to upload or remove attachments
            </p>
          )}
        </CardHeader>
        <CardContent>
          {allInspectionFiles.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allInspectionFiles.map((filePath, index) => {
                const fileName = filePath.split('/').pop() || `File ${index + 1}`;
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const isPDF = fileName.toLowerCase().endsWith('.pdf');
                const fileUrl = filePath.startsWith('http') 
                  ? filePath 
                  : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`;
                const isInspectionFile = inspectionFiles.includes(filePath);
                
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
                        <div className="flex justify-between">
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
                          {isEditing && isInspectionFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-300 hover:text-red-200 hover:bg-red-500/20 h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(filePath);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
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
              {isEditing ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Upload files using the form above or add evidence files to individual checklist items
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Enable edit mode to upload attachments
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAAttachmentsTabEnhanced;
