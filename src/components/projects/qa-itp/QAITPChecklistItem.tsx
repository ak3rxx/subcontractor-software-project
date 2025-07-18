
import React, { useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import SimpleFileUpload from './SimpleFileUpload';
import { ChecklistItem } from './QAITPTemplates';
import { SimpleUploadedFile } from '@/hooks/useSimpleFileUpload';
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
  const lastRecordedFiles = useRef<string>('');

  // Memoized file change handler with proper deduplication
  const handleFileChange = useCallback((files: SimpleUploadedFile[]) => {
    const currentFiles = item.evidenceFiles || [];
    
    // Create a stable string representation for comparison
    const newFilesSignature = JSON.stringify(files.map(f => ({ id: f.id, uploaded: f.uploaded, path: f.path })));
    const currentFilesSignature = JSON.stringify(currentFiles.map(f => ({ id: f.id, uploaded: f.uploaded, path: f.path })));
    
    // Only proceed if files actually changed
    if (newFilesSignature === currentFilesSignature) {
      console.log('Files unchanged, skipping update for item:', item.id);
      return;
    }

    // Additional check to prevent duplicate audit records
    if (lastRecordedFiles.current === newFilesSignature) {
      console.log('Same files signature as last recorded, skipping audit for item:', item.id);
      onChecklistChange(item.id, 'evidenceFiles', files);
      return;
    }

    console.log('Files changed for item', item.id, 'from', currentFiles.length, 'to', files.length);
    
    // Record audit trail for significant file changes
    if (inspectionId && (files.length !== currentFiles.length)) {
      const changeDescription = files.length > currentFiles.length 
        ? `Added ${files.length - currentFiles.length} file(s)`
        : `Removed ${currentFiles.length - files.length} file(s)`;
      
      setTimeout(() => {
        recordChange(
          'evidenceFiles',
          `${currentFiles.length} files`,
          `${files.length} files (${changeDescription})`,
          'update',
          item.id,
          item.description
        );
      }, 200); // Debounce to prevent rapid-fire recordings
      
      lastRecordedFiles.current = newFilesSignature;
    }
    
    onChecklistChange(item.id, 'evidenceFiles', files);
  }, [item.id, item.evidenceFiles, item.description, onChecklistChange, recordChange, inspectionId]);

  const handleStatusChange = useCallback((status: string) => {
    if (item.status === status) {
      return; // No change
    }

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
  }, [item.id, item.status, item.description, onChecklistChange, recordChange, inspectionId]);

  // Debounced comments handler to prevent excessive audit trail entries
  const handleCommentsChange = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return (comments: string) => {
      if (item.comments === comments) {
        return; // No change
      }

      console.log('Comments changed for item', item.id, ':', comments.length, 'chars');
      
      // Update immediately for UI responsiveness
      onChecklistChange(item.id, 'comments', comments);
      
      // Record audit trail with debouncing to prevent spam
      if (inspectionId && timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (inspectionId) {
        timeoutId = setTimeout(() => {
          recordChange(
            'comments',
            item.comments || '',
            comments,
            'update',
            item.id,
            item.description
          );
        }, 1000); // 1 second debounce for comments
      }
    };
  }, [item.id, item.comments, item.description, onChecklistChange, recordChange, inspectionId]);

  // Ensure evidenceFiles is always an array of SimpleUploadedFile objects
  const currentFiles = useMemo(() => {
    if (!item.evidenceFiles || !Array.isArray(item.evidenceFiles)) {
      return [];
    }
    
    return item.evidenceFiles.filter((file): file is SimpleUploadedFile => {
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
        <div className="flex gap-1">
          {['pass', 'fail', 'na'].map((status) => (
            <Button
              key={status}
              variant={item.status === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1 text-xs ${
                item.status === status 
                  ? status === 'pass' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : status === 'fail'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                  : 'hover:bg-muted'
              }`}
            >
              {status === 'pass' && <CheckCircle className="h-3 w-3 mr-1" />}
              {status === 'fail' && <XCircle className="h-3 w-3 mr-1" />}
              {status === 'na' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'N/A'}
            </Button>
          ))}
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

        <SimpleFileUpload
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
