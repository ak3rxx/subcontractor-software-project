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
  
  // Improved deduplication tracking
  const lastRecordedChanges = useRef<Map<string, { timestamp: number; content: string }>>(new Map());
  const pendingRecords = useRef<Set<string>>(new Set());
  
  // Use refs to prevent subscription loops
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const subscribedInspectionRef = useRef<string | undefined>(undefined);

  // Stable fetch function with better error handling
  const fetchChangeHistory = useCallback(async (currentInspectionId?: string, currentUser?: any) => {
    const targetInspectionId = currentInspectionId || inspectionId;
    const targetUser = currentUser || user;
    
    if (!targetUser || !targetInspectionId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_qa_change_history', {
        p_inspection_id: targetInspectionId
      });

      if (error) {
        console.error('Error fetching change history:', error);
        setChangeHistory([]);
        return;
      }

      const transformedData = (data || []).map((item: any) => ({
        ...item,
        timestamp: item.change_timestamp || item.timestamp,
        user_name: item.user_name || 'Unknown User'
      }));
      
      setChangeHistory(transformedData);
    } catch (error) {
      console.error('Unexpected error:', error);
      setChangeHistory([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable function

  // Improved recordChange with better deduplication
  const recordChange = useCallback(async (
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changeType: 'create' | 'update' | 'delete' = 'update',
    itemId?: string,
    itemDescription?: string
  ) => {
    if (!user || !inspectionId) {
      return;
    }

    // Don't record if old and new values are the same
    if (oldValue === newValue) {
      return;
    }

    // Create a content-based unique key for better deduplication
    const contentKey = `${itemId || 'form'}-${fieldName}-${JSON.stringify(oldValue)}-${JSON.stringify(newValue)}`;
    const now = Date.now();
    
    // Check if this exact change was recorded recently (within 5 seconds)
    const lastRecord = lastRecordedChanges.current.get(contentKey);
    if (lastRecord && (now - lastRecord.timestamp) < 5000) {
      console.log('Skipping duplicate change record within 5 seconds');
      return;
    }

    // Check if this change is already being processed
    if (pendingRecords.current.has(contentKey)) {
      console.log('Change already being processed, skipping');
      return;
    }

    // Mark as pending
    pendingRecords.current.add(contentKey);

    try {
      // Format values for better readability
      let formattedOldValue = oldValue;
      let formattedNewValue = newValue;
      
      // Handle status changes with timestamps
      if (fieldName === 'status' && newValue) {
        const timestamp = new Date().toLocaleString();
        formattedNewValue = `${newValue} (${timestamp})`;
      }
      
      // Handle file attachment changes more carefully
      if (fieldName === 'evidenceFiles') {
        try {
          const oldFiles = oldValue ? JSON.parse(oldValue) : [];
          const newFiles = newValue ? JSON.parse(newValue) : [];
          
          if (newFiles.length > oldFiles.length) {
            const addedFiles = newFiles.slice(oldFiles.length);
            const fileName = addedFiles[0]?.name || addedFiles[0]?.path?.split('/').pop() || 'Unknown file';
            formattedNewValue = `Added file: ${fileName}`;
            formattedOldValue = oldFiles.length > 0 ? `${oldFiles.length} existing file(s)` : null;
          } else if (newFiles.length < oldFiles.length) {
            const removedCount = oldFiles.length - newFiles.length;
            formattedNewValue = `Removed ${removedCount} file(s)`;
            formattedOldValue = `${oldFiles.length} file(s)`;
          }
        } catch {
          // Fallback to simple description
          formattedOldValue = oldValue ? 'Files attached' : null;
          formattedNewValue = newValue ? 'Files updated' : 'Files removed';
        }
      }

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
        // Update the last recorded changes map
        lastRecordedChanges.current.set(contentKey, {
          timestamp: now,
          content: `${formattedOldValue}->${formattedNewValue}`
        });
        
        // Clean up old entries (keep only last 50)
        if (lastRecordedChanges.current.size > 50) {
          const entries = Array.from(lastRecordedChanges.current.entries());
          const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          lastRecordedChanges.current = new Map(sorted.slice(0, 25));
        }
        
        // Debounced refetch - only after 1 second to allow batching
        setTimeout(() => {
          fetchChangeHistory(inspectionId, user);
        }, 1000);
      }
    } catch (error) {
      console.error('Error recording change:', error);
    } finally {
      // Remove from pending
      pendingRecords.current.delete(contentKey);
    }
  }, []); // No dependencies to prevent recreation

  // Fixed subscription management
  useEffect(() => {
    // Always fetch initial data
    fetchChangeHistory(inspectionId, user);

    // Clean up existing subscription if inspection changed
    if (subscriptionRef.current && subscribedInspectionRef.current !== inspectionId) {
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
          // Debounced refetch to prevent excessive calls
          setTimeout(() => fetchChangeHistory(inspectionId, user), 1500);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
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
