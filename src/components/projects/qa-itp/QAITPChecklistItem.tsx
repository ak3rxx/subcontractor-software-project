
import React, { useCallback } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SupabaseFileUpload from './SupabaseFileUpload';
// Removed QAFieldAuditTrail for simplicity
import { ChecklistItem } from './QAITPTemplates';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';

interface QAITPChecklistItemProps {
  item: ChecklistItem;
  onChecklistChange: (id: string, field: string, value: any) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
  inspectionId?: string | null;
}

const QAITPChecklistItem: React.FC<QAITPChecklistItemProps> = ({ 
  item, 
  onChecklistChange,
  onUploadStatusChange,
  inspectionId
}) => {
  const { recordChange } = useQAChangeHistory(inspectionId || '');

  const handleFileChange = useCallback((files: SupabaseUploadedFile[]) => {
    console.log('Files changed for item', item.id, ':', files);
    
    // Record audit trail for file changes
    if (inspectionId) {
      const oldFiles = item.evidenceFiles || [];
      recordChange(
        'evidenceFiles',
        JSON.stringify(oldFiles),
        JSON.stringify(files),
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

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">{item.description}</h4>
          <p className="text-sm text-gray-600 mt-1">{item.requirements}</p>
        </div>
      </div>
      
      <div className="space-y-3">
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

        <SupabaseFileUpload
          files={currentFiles}
          onFilesChange={handleFileChange}
          onUploadStatusChange={onUploadStatusChange}
          label="Evidence Photos/Documents"
          accept="image/*,.pdf,.doc,.docx"
          maxFiles={3}
          inspectionId={inspectionId}
          checklistItemId={item.id}
        />

        {/* Real-time audit trail removed for simplicity - available in main modal */}
      </div>
    </div>
  );
};

export default QAITPChecklistItem;
