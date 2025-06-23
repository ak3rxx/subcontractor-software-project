
import React, { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SupabaseFileUpload from './SupabaseFileUpload';
import { ChecklistItem } from './QAITPTemplates';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';

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
  const handleFileChange = useCallback((files: SupabaseUploadedFile[]) => {
    console.log('Files changed for item', item.id, ':', files);
    onChecklistChange(item.id, 'evidenceFiles', files);
  }, [item.id, onChecklistChange]);

  const handleStatusChange = useCallback((status: 'pass' | 'fail' | 'na' | '') => {
    console.log('Status changed for item', item.id, ':', status);
    onChecklistChange(item.id, 'status', status);
  }, [item.id, onChecklistChange]);

  const handleCommentsChange = useCallback((comments: string) => {
    console.log('Comments changed for item', item.id, ':', comments);
    onChecklistChange(item.id, 'comments', comments);
  }, [item.id, onChecklistChange]);

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
        <div className="flex gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-pass`}
              checked={item.status === 'pass'}
              onCheckedChange={(checked) => 
                handleStatusChange(checked ? 'pass' : '')
              }
            />
            <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-fail`}
              checked={item.status === 'fail'}
              onCheckedChange={(checked) => 
                handleStatusChange(checked ? 'fail' : '')
              }
            />
            <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-na`}
              checked={item.status === 'na'}
              onCheckedChange={(checked) => 
                handleStatusChange(checked ? 'na' : '')
              }
            />
            <Label htmlFor={`${item.id}-na`} className="text-gray-600">N/A</Label>
          </div>
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
      </div>
    </div>
  );
};

export default QAITPChecklistItem;
