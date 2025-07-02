
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import QAITPChecklistItemEnhanced from './QAITPChecklistItemEnhanced';
import { ChecklistItem } from './QAITPTemplates';

interface QAChecklistTabEnhancedProps {
  inspection: any;
  isEditing: boolean;
  onChecklistChange?: (items: any[]) => void;
}

const QAChecklistTabEnhanced: React.FC<QAChecklistTabEnhancedProps> = ({
  inspection,
  isEditing,
  onChecklistChange
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { recordChange } = useQAChangeHistory(inspection?.id);

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

  const handleChecklistItemChange = (itemId: string, field: string, value: any) => {
    if (!isEditing) {
      console.log('Not in editing mode, ignoring change');
      return;
    }
    
    console.log(`Checklist item change: ${itemId} ${field} = ${value}`);
    
    // Find the old value for audit trail
    const oldItem = checklistItems.find(item => item.id === itemId);
    const oldValue = oldItem ? oldItem[field as keyof ChecklistItem] : null;
    
    // Update the checklist items
    const updatedItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    
    setChecklistItems(updatedItems);
    onChecklistChange?.(updatedItems);

    // Record the change in audit trail
    if (recordChange && oldValue !== value) {
      const itemDescription = oldItem?.description || `Item ${itemId}`;
      console.log(`Recording audit trail for item ${itemId}: ${field} changed from ${oldValue} to ${value}`);
      
      recordChange(
        field,
        String(oldValue || ''),
        String(value || ''),
        'update',
        itemId,
        itemDescription
      );
    }
  };

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
          <CardTitle>Inspection Checklist</CardTitle>
          {isEditing && (
            <p className="text-sm text-muted-foreground">
              Make changes to checklist items. All changes are tracked in the audit trail.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {checklistItems.length > 0 ? (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <QAITPChecklistItemEnhanced
                  key={item.id}
                  item={item}
                  onChecklistChange={handleChecklistItemChange}
                  inspectionId={inspection?.id}
                  showAuditTrail={false}
                />
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
