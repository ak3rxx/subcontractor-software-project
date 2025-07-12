
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  
  // Track subscription state to prevent duplicates
  const subscriptionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const fetchChangeHistory = useCallback(async () => {
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
  }, [inspectionId]);

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
    mountedRef.current = true;
    
    if (!inspectionId) {
      setLoading(false);
      return;
    }

    // Clean up any existing subscription before creating a new one
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    const fetchData = async () => {
      if (!mountedRef.current) return;
      
      try {
        console.log('Fetching change history for inspection:', inspectionId);
        
        const { data, error } = await supabase.rpc('get_qa_change_history', {
          p_inspection_id: inspectionId
        });

        if (error) {
          console.error('Error fetching change history:', error);
          if (mountedRef.current) {
            setChangeHistory([]);
          }
          return;
        }

        if (mountedRef.current) {
          const mappedData = (data || []).map((item: any) => ({
            ...item,
            timestamp: item.change_timestamp || item.timestamp,
            user_name: item.user_name || 'Unknown User'
          }));
          setChangeHistory(mappedData);
        }
      } catch (error) {
        console.error('Error fetching change history:', error);
        if (mountedRef.current) {
          setChangeHistory([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up real-time subscription with unique channel name
    const channelName = `qa_change_history_${inspectionId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_change_history',
          filter: `inspection_id=eq.${inspectionId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Real-time change history update:', payload);
          // Debounced refresh to prevent rapid successive calls
          if (mountedRef.current) {
            setTimeout(() => {
              if (mountedRef.current) {
                fetchData();
              }
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates for qa_change_history');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error occurred');
        }
      });

    // Store the subscription reference
    subscriptionRef.current = channel;
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        console.log('Unsubscribing from qa_change_history real-time updates');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [inspectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    changeHistory,
    loading,
    recordChange,
    refetch: fetchChangeHistory
  };
};
