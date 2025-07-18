
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChangeHistoryEntry {
  id: string;
  timestamp?: string;
  change_timestamp?: string;
  user_id: string;
  user_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  item_id?: string;
  item_description?: string;
}

export const useQAChangeHistory = (inspectionId: string) => {
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Enhanced deduplication tracking
  const recordedChanges = useRef<Set<string>>(new Set());
  const lastRefresh = useRef<number>(0);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  // Enhanced unique key generation for better deduplication
  const generateChangeKey = useCallback((
    fieldName: string, 
    oldValue: string | null, 
    newValue: string | null, 
    itemId?: string
  ): string => {
    const timestamp = Math.floor(Date.now() / 1000); // Second precision
    return `${fieldName}-${itemId || 'global'}-${oldValue || 'null'}-${newValue || 'null'}-${timestamp}`;
  }, []);

  const fetchChangeHistory = useCallback(async () => {
    if (!inspectionId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_qa_change_history', {
        p_inspection_id: inspectionId
      });

      if (error) throw error;

      console.log('Fetched QA change history:', data?.length || 0, 'entries');
      setChangeHistory(data || []);
      lastRefresh.current = Date.now();
    } catch (error) {
      console.error('Error fetching QA change history:', error);
      toast({
        title: "Error",
        description: "Failed to load change history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId, toast]);

  // Optimized refresh function for real-time updates
  const refreshChangeHistory = useCallback((isRealtimeUpdate = false) => {
    // Skip debouncing for real-time updates
    if (isRealtimeUpdate) {
      console.log('Real-time refresh triggered');
      fetchChangeHistory();
      return;
    }

    // Only debounce manual refreshes
    const timeSinceLastRefresh = Date.now() - lastRefresh.current;
    if (timeSinceLastRefresh < 2000) { // Minimum 2 seconds between manual refreshes
      console.log('Skipping manual refresh - too soon since last refresh');
      return;
    }

    console.log('Manual refresh after debounce');
    fetchChangeHistory();
  }, [fetchChangeHistory]);

  const recordChange = useCallback(async (
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changeType: 'create' | 'update' | 'delete' = 'update',
    itemId?: string,
    itemDescription?: string
  ): Promise<void> => {
    if (!inspectionId) {
      console.warn('Cannot record change: no inspection ID');
      return;
    }

    // Generate unique key for deduplication
    const changeKey = generateChangeKey(fieldName, oldValue, newValue, itemId);
    
    // Enhanced deduplication check with time window
    if (recordedChanges.current.has(changeKey)) {
      console.log('Duplicate change detected, skipping:', changeKey);
      return;
    }

    // Add to recorded changes set
    recordedChanges.current.add(changeKey);
    
    // Clean up old entries from the set to prevent memory leaks
    if (recordedChanges.current.size > 1000) {
      const entries = Array.from(recordedChanges.current);
      recordedChanges.current = new Set(entries.slice(-500)); // Keep last 500 entries
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.warn('Cannot record change: user not authenticated');
        return;
      }

      console.log('Recording QA change:', { fieldName, changeType, itemId, itemDescription });

      const { error } = await supabase.rpc('record_qa_change', {
        p_inspection_id: inspectionId,
        p_user_id: userData.user.id,
        p_field_name: fieldName,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_change_type: changeType,
        p_item_id: itemId,
        p_item_description: itemDescription
      });

      if (error) throw error;

      console.log('QA change recorded successfully');
      
      // Real-time updates will handle the refresh, no need to call it manually
      
    } catch (error) {
      console.error('Error recording QA change:', error);
      
      // Remove from recorded changes on error so it can be retried
      recordedChanges.current.delete(changeKey);
      
      toast({
        title: "Error",
        description: "Failed to record change in history",
        variant: "destructive"
      });
    }
  }, [inspectionId, toast, generateChangeKey]);

  // Set up real-time subscription
  useEffect(() => {
    if (!inspectionId) return;

    console.log('Setting up real-time subscription for QA change history:', inspectionId);

    // Clean up existing subscription
    if (realtimeChannel.current) {
      console.log('Cleaning up existing real-time subscription');
      supabase.removeChannel(realtimeChannel.current);
    }

    // Create new subscription
    realtimeChannel.current = supabase
      .channel(`qa_change_history:${inspectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_change_history',
          filter: `inspection_id=eq.${inspectionId}`
        },
        (payload) => {
          console.log('Real-time change history insert:', payload);
          // Refresh the change history when new entries are added
          refreshChangeHistory(true);
        }
      )
      .subscribe((status) => {
        console.log('QA change history subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to QA change history updates');
        }
      });

    return () => {
      if (realtimeChannel.current) {
        console.log('Cleaning up QA change history subscription');
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
    };
  }, [inspectionId, refreshChangeHistory]);

  // Initial load
  useEffect(() => {
    if (inspectionId) {
      console.log('Loading QA change history for inspection:', inspectionId);
      fetchChangeHistory();
    }
  }, [inspectionId, fetchChangeHistory]);

  return {
    changeHistory,
    isLoading,
    recordChange,
    refreshChangeHistory: () => refreshChangeHistory(false) // Manual refresh
  };
};
