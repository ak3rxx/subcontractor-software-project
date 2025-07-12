
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  
  // Use refs to prevent subscription loops - mirroring useQAInspectionsSimple pattern
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const subscribedInspectionRef = useRef<string | undefined>(undefined);

  // Stable fetch function with debouncing - mirrors useQAInspectionsSimple pattern
  const fetchChangeHistory = useCallback(async (currentInspectionId?: string, currentUser?: any) => {
    const targetInspectionId = currentInspectionId || inspectionId;
    const targetUser = currentUser || user;
    
    if (!targetUser || !targetInspectionId) {
      setLoading(false);
      return;
    }

    console.log('QA History: Fetching change history for inspection:', targetInspectionId);
    try {
      const { data, error } = await supabase.rpc('get_qa_change_history', {
        p_inspection_id: targetInspectionId
      });

      if (error) {
        console.error('Error fetching change history:', error);
        setChangeHistory([]);
        return;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        timestamp: item.change_timestamp || item.timestamp,
        user_name: item.user_name || 'Unknown User'
      }));
      
      setChangeHistory(transformedData);
      console.log('QA History: Fetched', transformedData.length, 'change entries');
    } catch (error) {
      console.error('Unexpected error:', error);
      setChangeHistory([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable function

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
          fetchChangeHistory(inspectionId, user);
        }, 200);
      }
    } catch (error) {
      console.error('Error recording change:', error);
    }
  };

  // Fixed subscription management with deduplication - mirrors useQAInspectionsSimple
  useEffect(() => {
    console.log('QA History: Effect triggered for inspection:', inspectionId, 'user:', user?.id);
    
    // Always fetch initial data
    fetchChangeHistory(inspectionId, user);

    // Clean up existing subscription if inspection changed
    if (subscriptionRef.current && subscribedInspectionRef.current !== inspectionId) {
      console.log('QA History: Cleaning up old subscription for inspection:', subscribedInspectionRef.current);
      subscriptionRef.current.unsubscribe();
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      subscribedInspectionRef.current = undefined;
    }

    // Only subscribe if we have a valid user and inspection ID and no existing subscription for this inspection
    if (!user || !inspectionId || subscribedInspectionRef.current === inspectionId) {
      return;
    }

    // Create new subscription
    const channelName = `qa_change_history_${inspectionId}_${Date.now()}`;
    console.log('QA History: Creating new subscription:', channelName);
    
    subscribedInspectionRef.current = inspectionId;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'qa_change_history',
          filter: `inspection_id=eq.${inspectionId}`
        }, 
        (payload) => {
          console.log('QA History: Real-time change detected:', payload.eventType);
          // Simple debounced refetch
          setTimeout(() => fetchChangeHistory(inspectionId, user), 500);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      console.log('QA History: Component cleanup for inspection:', inspectionId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        subscribedInspectionRef.current = undefined;
      }
    };
  }, [inspectionId, user?.id, fetchChangeHistory]);

  // Stable refetch function
  const refetch = useCallback(() => {
    fetchChangeHistory(inspectionId, user);
  }, [fetchChangeHistory, inspectionId, user]);

  return {
    changeHistory,
    loading,
    recordChange,
    refetch
  };
};
