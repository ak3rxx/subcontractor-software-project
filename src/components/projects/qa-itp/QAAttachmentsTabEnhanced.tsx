
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Image, Trash2, Lock } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import QAFileUploadSystem from './QAFileUploadSystem';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';

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
  const [allFiles, setAllFiles] = useState<SupabaseUploadedFile[]>([]);
  const [inspectionFiles, setInspectionFiles] = useState<SupabaseUploadedFile[]>([]);
  const { getChecklistItems } = useQAInspections();

  useEffect(() => {
    const fetchAllFiles = async () => {
      if (inspection?.id) {
        try {
          const items = await getChecklistItems(inspection.id);
          const files: SupabaseUploadedFile[] = [];
          items.forEach(item => {
            if (item.evidence_files && Array.isArray(item.evidence_files)) {
              // Convert string paths to SupabaseUploadedFile format
              const convertedFiles = item.evidence_files.map((filePath: string, index: number) => ({
                id: `${item.id}-${index}`,
                file: new File([], filePath.split('/').pop() || 'file'),
                url: filePath.startsWith('http') ? filePath : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`,
                name: filePath.split('/').pop() || 'file',
                size: 0,
                type: '',
                path: filePath,
                uploaded: true
              }));
              files.push(...convertedFiles);
            }
          });
          setAllFiles(files);
          
          // Also get inspection-level files if any
          const inspectionAttachments = inspection.attachments || [];
          const convertedInspectionFiles = inspectionAttachments.map((filePath: string, index: number) => ({
            id: `inspection-${index}`,
            file: new File([], filePath.split('/').pop() || 'file'),
            url: filePath.startsWith('http') ? filePath : `https://deobtjgmduxzhxstbejm.supabase.co/storage/v1/object/public/qainspectionfiles/${filePath}`,
            name: filePath.split('/').pop() || 'file',
            size: 0,
            type: '',
            path: filePath,
            uploaded: true
          }));
          setInspectionFiles(convertedInspectionFiles);
        } catch (error) {
          console.error('Error fetching inspection files:', error);
        }
      }
    };

    fetchAllFiles();
  }, [inspection?.id, getChecklistItems]);

  const handleFileClick = (file: SupabaseUploadedFile) => {
    window.open(file.url, '_blank');
  };

  const handleInspectionFileUpload = (files: SupabaseUploadedFile[]) => {
    if (!isEditing) return;
    
    const oldCount = inspectionFiles.length;
    const updatedFiles = [...inspectionFiles, ...files];
    setInspectionFiles(updatedFiles);
    
    // Convert to string paths for backward compatibility
    const filePaths = updatedFiles.map(f => f.path);
    onAttachmentsChange?.(filePaths);

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

  const handleRemoveFile = (fileToRemove: SupabaseUploadedFile) => {
    if (!isEditing) return;
    
    const oldCount = inspectionFiles.length;
    const updatedFiles = inspectionFiles.filter(file => file.id !== fileToRemove.id);
    setInspectionFiles(updatedFiles);
    
    // Convert to string paths for backward compatibility
    const filePaths = updatedFiles.map(f => f.path);
    onAttachmentsChange?.(filePaths);

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
            <QAFileUploadSystem
              files={inspectionFiles}
              onFilesChange={handleInspectionFileUpload}
              label="Upload Inspection Files"
              accept="image/*,.pdf,.doc,.docx,.xlsx,.dwg"
              maxFiles={20}
              inspectionId={inspection?.id}
              disabled={!isEditing}
              showThumbnails={true}
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
            <QAFileUploadSystem
              files={allInspectionFiles}
              onFilesChange={() => {}} // Read-only view
              label="All Inspection Files"
              disabled={true}
              showThumbnails={true}
            />
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
