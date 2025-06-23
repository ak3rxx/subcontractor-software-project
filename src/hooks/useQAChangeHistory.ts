
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChangeHistoryEntry {
  id: string;
  timestamp: string;
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
      const { data, error } = await supabase
        .from('qa_change_history')
        .select(`
          *,
          profiles!qa_change_history_user_id_fkey(full_name)
        `)
        .eq('inspection_id', inspectionId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching change history:', error);
        return;
      }

      const transformedHistory = (data || []).map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        user_id: entry.user_id,
        user_name: entry.profiles?.full_name || 'Unknown User',
        field_name: entry.field_name,
        old_value: entry.old_value,
        new_value: entry.new_value,
        change_type: entry.change_type,
        item_id: entry.item_id,
        item_description: entry.item_description
      }));

      setChangeHistory(transformedHistory);
    } catch (error) {
      console.error('Error:', error);
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
    if (!user || !inspectionId) return;

    try {
      const { error } = await supabase
        .from('qa_change_history')
        .insert({
          inspection_id: inspectionId,
          user_id: user.id,
          field_name: fieldName,
          old_value: oldValue,
          new_value: newValue,
          change_type: changeType,
          item_id: itemId,
          item_description: itemDescription,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording change:', error);
      } else {
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
