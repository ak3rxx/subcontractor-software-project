
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload } from 'lucide-react';

interface ChecklistItem {
  id: string;
  description: string;
  requirements: string;
  status: 'pass' | 'fail' | 'na' | '';
  comments: string;
  evidence?: File[];
  isFireDoorOnly?: boolean;
}

interface QAITPChecklistItemProps {
  item: ChecklistItem;
  onChecklistChange: (id: string, field: string, value: any) => void;
}

const QAITPChecklistItem: React.FC<QAITPChecklistItemProps> = ({
  item,
  onChecklistChange
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <h4 className="font-medium">{item.description}</h4>
        <p className="text-sm text-gray-600 mt-1">{item.requirements}</p>
      </div>
      
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
        <Label htmlFor={`${item.id}-comments`}>Comments (Optional)</Label>
        <Textarea
          id={`${item.id}-comments`}
          value={item.comments}
          onChange={(e) => onChecklistChange(item.id, 'comments', e.target.value)}
          placeholder="Add any additional comments..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Evidence Photos</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Attach clear, timestamped photos for inspection evidence
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click to browse or drag files here
          </p>
        </div>
      </div>
    </div>
  );
};

export default QAITPChecklistItem;
