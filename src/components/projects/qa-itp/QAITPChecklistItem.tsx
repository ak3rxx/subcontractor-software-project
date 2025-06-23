import React, { useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from './FileUpload';
import { ChecklistItem } from './QAITPTemplates';

interface QAITPChecklistItemProps {
  item: ChecklistItem;
  onChecklistChange: (id: string, field: string, value: any) => void;
  onUploadStatusChange?: (isUploading: boolean, hasFailures: boolean) => void;
}

const QAITPChecklistItem: React.FC<QAITPChecklistItemProps> = ({ 
  item, 
  onChecklistChange,
  onUploadStatusChange 
}) => {
  const handleFileChange = useCallback((files: File[]) => {
    onChecklistChange(item.id, 'evidenceFiles', files);
  }, [item.id, onChecklistChange]);

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
                onChecklistChange(item.id, 'status', checked ? 'pass' : '')
              }
            />
            <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-fail`}
              checked={item.status === 'fail'}
              onCheckedChange={(checked) => 
                onChecklistChange(item.id, 'status', checked ? 'fail' : '')
              }
            />
            <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${item.id}-na`}
              checked={item.status === 'na'}
              onCheckedChange={(checked) => 
                onChecklistChange(item.id, 'status', checked ? 'na' : '')
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
            onChange={(e) => onChecklistChange(item.id, 'comments', e.target.value)}
            placeholder="Add comments..."
            rows={2}
          />
        </div>

        <FileUpload
          files={item.evidenceFiles || []}
          onFilesChange={(files) => handleFileChange(files)}
          onUploadStatusChange={onUploadStatusChange}
          label="Evidence Photos/Documents"
          accept="image/*,.pdf,.doc,.docx"
          maxFiles={3}
        />
      </div>
    </div>
  );
};

export default QAITPChecklistItem;
