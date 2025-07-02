
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useQAChecklistItemUpdates } from '@/hooks/useQAChecklistItemUpdates';
import QAITPChecklistItemEnhanced from './QAITPChecklistItemEnhanced';
import { ChecklistItem } from './QAITPTemplates';

interface QAChecklistTabEnhancedProps {
  inspection: any;
  isEditing: boolean;
  onChecklistChange?: (items: any[]) => void;
  recordChange?: (field: string, oldValue: string, newValue: string, changeType?: string, itemId?: string, itemDescription?: string) => void;
}

const QAChecklistTabEnhanced: React.FC<QAChecklistTabEnhancedProps> = ({
  inspection,
  isEditing,
  onChecklistChange,
  recordChange
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());
  
  const { updateChecklistItem, updating } = useQAChecklistItemUpdates(inspection?.id);

  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (inspection?.id) {
        setLoading(true);
        try {
          console.log('Fetching checklist items for inspection:', inspection.id);
          const { data, error } = await supabase
            .from('qa_checklist_items')
            .select('*')
            .eq('inspection_id', inspection.id)
            .order('item_id');

          if (error) {
            console.error('Error fetching checklist items:', error);
            setChecklistItems([]);
            return;
          }

          console.log('Fetched checklist items:', data);
          // Transform database items to ChecklistItem format
          const transformedItems: ChecklistItem[] = (data || []).map(item => ({
            id: item.item_id,
            description: item.description,
            requirements: item.requirements,
            status: (item.status as 'pass' | 'fail' | 'na' | '') || '',
            comments: item.comments || '',
            evidenceFiles: item.evidence_files || []
          }));
          setChecklistItems(transformedItems);
        } catch (error) {
          console.error('Error fetching checklist items:', error);
          setChecklistItems([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChecklistItems();
  }, [inspection?.id]);

  const handleChecklistItemChange = useCallback(async (itemId: string, field: string, value: any) => {
    if (!isEditing) {
      console.log('Not in editing mode, ignoring change');
      return;
    }
    
    console.log(`Checklist item change: ${itemId} ${field} = ${value}`);
    
    // Update local state immediately for responsive UI
    const updatedItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    
    setChecklistItems(updatedItems);
    setModifiedItems(prev => new Set(prev).add(itemId));
    
    // Notify parent component of changes
    onChecklistChange?.(updatedItems);

    // Update database in real-time with debouncing
    const timeoutId = setTimeout(async () => {
      await updateChecklistItem(itemId, field, value, recordChange);
      // Remove from modified items after successful save
      setModifiedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 500); // 500ms debounce

    // Store timeout ID for cleanup if needed
    return () => clearTimeout(timeoutId);
  }, [isEditing, checklistItems, onChecklistChange, updateChecklistItem, recordChange]);

  const handleRecordChange = useCallback((field: string, oldValue: string, newValue: string, itemId: string, itemDescription: string) => {
    if (recordChange) {
      console.log(`Recording audit trail for item ${itemId}: ${field} changed from "${oldValue}" to "${newValue}"`);
      recordChange(field, oldValue, newValue, 'field_update', itemId, itemDescription);
    }
  }, [recordChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Checklist</span>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  View Mode
                </span>
              )}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    Edit Mode - Changes Auto-Saved
                  </span>
                  {modifiedItems.size > 0 && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      {modifiedItems.size} items modified
                    </span>
                  )}
                  {updating && (
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full animate-pulse">
                      Saving...
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardTitle>
          {isEditing && (
            <p className="text-sm text-muted-foreground">
              Changes are automatically saved as you make them. All changes are tracked in the audit trail.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {checklistItems.length > 0 ? (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="relative">
                  {modifiedItems.has(item.id) && (
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                  )}
                  <QAITPChecklistItemEnhanced
                    item={item}
                    onChecklistChange={handleChecklistItemChange}
                    inspectionId={inspection?.id}
                    showAuditTrail={false}
                    isEditing={isEditing}
                    onRecordChange={handleRecordChange}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No checklist items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAChecklistTabEnhanced;
