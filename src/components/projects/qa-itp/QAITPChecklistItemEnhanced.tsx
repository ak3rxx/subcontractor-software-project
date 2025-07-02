import React, { useCallback } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SupabaseFileUploadEnhanced from './SupabaseFileUploadEnhanced';
import QAFieldAuditTrailLive from './QAFieldAuditTrailLive';
import { ChecklistItem } from './QAITPTemplates';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface QAITPChecklistItemEnhancedProps {
  item: ChecklistItem;
  onChecklistChange: (id: string, field: string, value: any) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  inspectionId?: string | null;
  showAuditTrail?: boolean;
}

const QAITPChecklistItemEnhanced: React.FC<QAITPChecklistItemEnhancedProps> = ({ 
  item, 
  onChecklistChange,
  onUploadStatusChange,
  inspectionId,
  showAuditTrail = true
}) => {
  const { recordChange } = useQAChangeHistory(inspectionId || '');

  const handleFileChange = useCallback((files: SupabaseUploadedFile[]) => {
    console.log('Files changed for item', item.id, ':', files);
    
    // Record audit trail for file changes
    if (inspectionId) {
      const oldFiles = item.evidenceFiles || [];
      recordChange(
        'evidenceFiles',
        `${oldFiles.length} files`,
        `${files.length} files`,
        'update',
        item.id,
        item.description
      );
    }
    
    onChecklistChange(item.id, 'evidenceFiles', files);
  }, [item.id, onChecklistChange, recordChange, inspectionId, item.description, item.evidenceFiles]);

  const handleStatusChange = useCallback((status: string) => {
    console.log('Status changed for item', item.id, ':', status);
    
    // Record audit trail for status changes
    if (inspectionId) {
      recordChange(
        'status',
        item.status || '',
        status,
        'update',
        item.id,
        item.description
      );
    }
    
    onChecklistChange(item.id, 'status', status);
  }, [item.id, onChecklistChange, recordChange, inspectionId, item.status, item.description]);

  const handleCommentsChange = useCallback((comments: string) => {
    console.log('Comments changed for item', item.id, ':', comments);
    
    // Record audit trail for comments changes
    if (inspectionId) {
      recordChange(
        'comments',
        item.comments || '',
        comments,
        'update',
        item.id,
        item.description
      );
    }
    
    onChecklistChange(item.id, 'comments', comments);
  }, [item.id, onChecklistChange, recordChange, inspectionId, item.comments, item.description]);

  // Ensure evidenceFiles is always an array of SupabaseUploadedFile objects
  const currentFiles = React.useMemo(() => {
    if (!item.evidenceFiles || !Array.isArray(item.evidenceFiles)) {
      return [];
    }
    
    return item.evidenceFiles.filter((file): file is SupabaseUploadedFile => {
      return file && typeof file === 'object' && 'id' in file && 'url' in file;
    });
  }, [item.evidenceFiles]);

  const getStatusIcon = () => {
    switch (item.status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'na':
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{item.description}</h4>
            {getStatusIcon()}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{item.requirements}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Status *</Label>
          <RadioGroup
            value={item.status || ''}
            onValueChange={handleStatusChange}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pass" id={`${item.id}-pass`} />
              <Label htmlFor={`${item.id}-pass`} className="text-green-600 font-medium cursor-pointer">
                Pass
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fail" id={`${item.id}-fail`} />
              <Label htmlFor={`${item.id}-fail`} className="text-red-600 font-medium cursor-pointer">
                Fail
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="na" id={`${item.id}-na`} />
              <Label htmlFor={`${item.id}-na`} className="text-muted-foreground font-medium cursor-pointer">
                N/A
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${item.id}-comments`}>Comments</Label>
          <Textarea
            id={`${item.id}-comments`}
            value={item.comments || ''}
            onChange={(e) => handleCommentsChange(e.target.value)}
            placeholder="Add comments..."
            rows={2}
          />
        </div>

        <SupabaseFileUploadEnhanced
          files={currentFiles}
          onFilesChange={handleFileChange}
          onUploadStatusChange={onUploadStatusChange}
          label="Evidence Photos/Documents"
          accept="image/*,.pdf,.doc,.docx"
          maxFiles={5}
          inspectionId={inspectionId}
          checklistItemId={item.id}
        />

        {/* Show real-time audit trail for this checklist item */}
        {showAuditTrail && inspectionId && (
          <QAFieldAuditTrailLive
            inspectionId={inspectionId}
            fieldName={item.id}
            className="mt-3 bg-muted/10"
            autoRefresh={true}
            refreshInterval={10000}
          />
        )}
      </div>
    </div>
  );
};

export default QAITPChecklistItemEnhanced;