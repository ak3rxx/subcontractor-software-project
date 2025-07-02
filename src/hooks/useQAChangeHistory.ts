
import { useState, useEffect, useRef } from 'react';
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
  
  // Track the last recorded changes to prevent duplicates
  const lastRecordedChanges = useRef<Map<string, string>>(new Map());

  const fetchChangeHistory = async () => {
    if (!inspectionId) {
      setLoading(false);
      return;
    }

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

    // Create a unique key for this change
    const changeKey = `${itemId || 'form'}-${fieldName}-${oldValue}-${newValue}`;
    
    // Check if this exact change was already recorded recently
    const lastRecorded = lastRecordedChanges.current.get(changeKey);
    const now = Date.now().toString();
    
    if (lastRecorded && (parseInt(now) - parseInt(lastRecorded)) < 1000) {
      console.log('Skipping duplicate change record within 1 second');
      return;
    }

    // Don't record if old and new values are the same
    if (oldValue === newValue) {
      console.log('Skipping change record: values are the same');
      return;
    }

    // Format values for better readability
    let formattedOldValue = oldValue;
    let formattedNewValue = newValue;
    
    // Handle status changes with timestamps
    if (fieldName === 'status' && newValue) {
      const timestamp = new Date().toLocaleString();
      formattedNewValue = `${newValue} (${timestamp})`;
    }
    
    // Handle file attachment changes
    if (fieldName === 'evidenceFiles') {
      try {
        const oldFiles = oldValue ? JSON.parse(oldValue) : [];
        const newFiles = newValue ? JSON.parse(newValue) : [];
        
        if (newFiles.length > oldFiles.length) {
          const addedFiles = newFiles.slice(oldFiles.length);
          formattedNewValue = `Added ${addedFiles.length} file(s): ${addedFiles.map((f: any) => f.name || 'Unknown').join(', ')}`;
          formattedOldValue = oldFiles.length > 0 ? `${oldFiles.length} existing file(s)` : 'No files';
        } else if (newFiles.length < oldFiles.length) {
          const removedCount = oldFiles.length - newFiles.length;
          formattedNewValue = `Removed ${removedCount} file(s)`;
          formattedOldValue = `${oldFiles.length} file(s)`;
        }
      } catch {
        // Fallback to original values if JSON parsing fails
        formattedOldValue = oldValue ? 'Files attached' : 'No files';
        formattedNewValue = newValue ? 'Files updated' : 'Files removed';
      }
    }

    try {
      console.log('Recording change:', {
        inspectionId,
        fieldName,
        oldValue: formattedOldValue,
        newValue: formattedNewValue,
        changeType,
        itemId,
        itemDescription
      });

      const { error } = await supabase.rpc('record_qa_change', {
        p_inspection_id: inspectionId,
        p_user_id: user.id,
        p_field_name: fieldName,
        p_old_value: formattedOldValue,
        p_new_value: formattedNewValue,
        p_change_type: changeType,
        p_item_id: itemId,
        p_item_description: itemDescription
      });

      if (error) {
        console.error('Error recording change:', error);
      } else {
        console.log('Change recorded successfully');
        
        // Update the last recorded changes map
        lastRecordedChanges.current.set(changeKey, now);
        
        // Clean up old entries (keep only last 100)
        if (lastRecordedChanges.current.size > 100) {
          const entries = Array.from(lastRecordedChanges.current.entries());
          const sorted = entries.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
          lastRecordedChanges.current = new Map(sorted.slice(0, 50));
        }
        
        // Refresh the change history after a short delay to allow database to update
        setTimeout(() => {
          fetchChangeHistory();
        }, 200);
      }
    } catch (error) {
      console.error('Error recording change:', error);
    }
  };

  useEffect(() => {
    if (inspectionId) {
      fetchChangeHistory();
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      setChangeHistory([]);
      setLoading(false);
      lastRecordedChanges.current.clear();
    };
  }, [inspectionId]);

  return {
    changeHistory,
    loading,
    recordChange,
    refetch: fetchChangeHistory
  };
};
