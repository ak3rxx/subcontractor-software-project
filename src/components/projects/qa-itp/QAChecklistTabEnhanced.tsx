import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
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
  const { getChecklistItems } = useQAInspectionsSimple();

  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (inspection?.id) {
        setLoading(true);
        try {
          const items = await getChecklistItems(inspection.id);
          // Transform database items to ChecklistItem format
          const transformedItems: ChecklistItem[] = items.map(item => ({
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
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChecklistItems();
  }, [inspection?.id, getChecklistItems]);

  const handleChecklistItemChange = (itemId: string, field: string, value: any) => {
    if (!isEditing) return;
    
    const updatedItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setChecklistItems(updatedItems);
    onChecklistChange?.(updatedItems);
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