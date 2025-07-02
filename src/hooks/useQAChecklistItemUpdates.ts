
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useQAChecklistItemUpdates = (inspectionId: string | null) => {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const updateChecklistItem = useCallback(async (
    itemId: string,
    field: string,
    value: any,
    recordChange?: (field: string, oldValue: string, newValue: string, itemId: string, itemDescription: string) => void
  ) => {
    if (!inspectionId) return;

    setUpdating(true);
    try {
      console.log(`Updating checklist item ${itemId}: ${field} = ${value}`);

      // Get the current item to record the old value
      const { data: currentItem, error: fetchError } = await supabase
        .from('qa_checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('item_id', itemId)
        .single();

      if (fetchError) {
        console.error('Error fetching current item:', fetchError);
        throw fetchError;
      }

      const oldValue = currentItem?.[field] || '';
      
      // Update the item in the database
      const { error: updateError } = await supabase
        .from('qa_checklist_items')
        .update({ [field]: value })
        .eq('inspection_id', inspectionId)
        .eq('item_id', itemId);

      if (updateError) {
        console.error('Error updating checklist item:', updateError);
        throw updateError;
      }

      // Record the change in audit trail
      if (recordChange && currentItem) {
        recordChange(
          field,
          String(oldValue),
          String(value),
          itemId,
          currentItem.description
        );
      }

      console.log(`Successfully updated checklist item ${itemId}`);
      
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      toast({
        title: "Update failed",
        description: `Failed to update ${field}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  }, [inspectionId, toast]);

  const updateMultipleItems = useCallback(async (updates: Array<{
    itemId: string;
    field: string;
    value: any;
  }>) => {
    if (!inspectionId) return;

    setUpdating(true);
    try {
      // Process updates sequentially to maintain audit trail
      for (const update of updates) {
        await updateChecklistItem(update.itemId, update.field, update.value);
      }
    } finally {
      setUpdating(false);
    }
  }, [inspectionId, updateChecklistItem]);

  return {
    updateChecklistItem,
    updateMultipleItems,
    updating
  };
};
