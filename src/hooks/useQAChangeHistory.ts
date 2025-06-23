
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChangeHistoryEntry {
  id: string;
  change_timestamp: string;
  user_id: string;
  user_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'create' | 'update' | 'delete';
  item_id?: string;
  item_description?: string;
}

export const useQAChangeHistory = (inspectionId: string) => {
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchChangeHistory = async () => {
    if (!inspectionId) return;

    try {
      console.log('Fetching change history for inspection:', inspectionId);
      
      const { data, error } = await supabase.rpc('get_qa_change_history', {
        p_inspection_id: inspectionId
      });

      if (error) {
        console.error('Error fetching change history:', error);
        setChangeHistory([]);
        return;
      }

      console.log('Change history data received:', data);

      // Map the data to match our interface
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        timestamp: item.change_timestamp || item.timestamp,
        user_name: item.user_name || 'Unknown User'
      }));

      setChangeHistory(mappedData);
    } catch (error) {
      console.error('Error fetching change history:', error);
      setChangeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const recordChange = async (
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changeType: 'create' | 'update' | 'delete' = 'update',
    itemId?: string,
    itemDescription?: string
  ) => {
    if (!user || !inspectionId) {
      console.log('Cannot record change: missing user or inspection ID');
      return;
    }

    try {
      console.log('Recording change:', {
        inspectionId,
        fieldName,
        oldValue,
        newValue,
        changeType,
        itemId,
        itemDescription
      });

      const { error } = await supabase.rpc('record_qa_change', {
        p_inspection_id: inspectionId,
        p_user_id: user.id,
        p_field_name: fieldName,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_change_type: changeType,
        p_item_id: itemId,
        p_item_description: itemDescription
      });

      if (error) {
        console.error('Error recording change:', error);
      } else {
        console.log('Change recorded successfully');
        // Refresh the change history
        fetchChangeHistory();
      }
    } catch (error) {
      console.error('Error recording change:', error);
    }
  };

  useEffect(() => {
    fetchChangeHistory();
  }, [inspectionId]);

  return {
    changeHistory,
    loading,
    recordChange,
    refetch: fetchChangeHistory
  };
};
