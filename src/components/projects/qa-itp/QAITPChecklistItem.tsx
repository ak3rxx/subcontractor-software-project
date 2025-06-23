
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Image } from 'lucide-react';
import FileUpload from './FileUpload';

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
  const handleFileChange = (files: File[]) => {
    onChecklistChange(item.id, 'evidence', files);
  };

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

      <FileUpload
        files={item.evidence || []}
        onFilesChange={handleFileChange}
        label="Upload Evidence Photos"
        accept="image/*,.pdf,.doc,.docx"
        maxFiles={3}
      />

      {item.evidence && item.evidence.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Evidence Files:</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {item.evidence.map((file, index) => (
              <div key={index} className="border rounded p-2 text-center">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="evidence-image w-full h-20 object-cover rounded mb-1"
                  />
                ) : (
                  <FileText className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                )}
                <p className="text-xs text-gray-600 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QAITPChecklistItem;
