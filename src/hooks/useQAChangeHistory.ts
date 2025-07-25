
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
  const subscriptionActive = useRef<boolean>(false);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

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

  const fetchChangeHistory = useCallback(async (forceFresh = false) => {
    if (!inspectionId) return;

    setIsLoading(true);
    try {
      console.log('Fetching QA change history for inspection:', inspectionId, forceFresh ? '(force fresh)' : '');
      
      const { data, error } = await supabase.rpc('get_qa_change_history', {
        p_inspection_id: inspectionId
      });

      if (error) throw error;

      console.log('Fetched QA change history:', data?.length || 0, 'entries');
      
      // Always update state with fresh data
      setChangeHistory(data || []);
      lastRefresh.current = Date.now();
      
      console.log('Change history state updated with', data?.length || 0, 'entries');
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

  // Enhanced real-time refresh with faster response
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }
    
    refreshTimeout.current = setTimeout(() => {
      console.log('Real-time refresh triggered');
      fetchChangeHistory(true);
    }, 150); // Reduced to 150ms for faster real-time feel
  }, [fetchChangeHistory]);

  // Optimized refresh function for real-time updates
  const refreshChangeHistory = useCallback((isRealtimeUpdate = false) => {
    if (isRealtimeUpdate) {
      console.log('Real-time refresh triggered - using debounced approach');
      debouncedRefresh();
      return;
    }

    // Only debounce manual refreshes
    const timeSinceLastRefresh = Date.now() - lastRefresh.current;
    if (timeSinceLastRefresh < 2000) { // Minimum 2 seconds between manual refreshes
      console.log('Skipping manual refresh - too soon since last refresh');
      return;
    }

    console.log('Manual refresh after debounce');
    fetchChangeHistory(true);
  }, [fetchChangeHistory, debouncedRefresh]);

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

      // Immediately refresh the change history after recording
      setTimeout(() => {
        console.log('Auto-refreshing change history after recording change');
        fetchChangeHistory(true);
      }, 100);
      
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
  }, [inspectionId, toast, generateChangeKey, fetchChangeHistory]);

  // Set up real-time subscription with stable handler
  useEffect(() => {
    if (!inspectionId) return;

    // Enhanced subscription management to prevent duplicates and errors
    if (subscriptionActive.current) {
      console.log('Subscription already active for inspection:', inspectionId);
      return;
    }

    // Additional safety check to prevent subscription errors
    try {

    console.log('Setting up real-time subscription for QA change history:', inspectionId);

    // Clean up existing subscription first
    if (realtimeChannel.current) {
      console.log('Cleaning up existing real-time subscription');
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }

    // Enhanced real-time handler with immediate updates
    const handleRealtimeInsert = (payload: any) => {
      console.log('Real-time change history insert received:', payload);
      
      // Immediate optimistic update for better UX
      if (payload.new && payload.new.inspection_id === inspectionId) {
        setChangeHistory(prev => {
          const newEntry = {
            id: payload.new.id,
            timestamp: payload.new.created_at || payload.new.timestamp,
            change_timestamp: payload.new.created_at || payload.new.timestamp,
            user_id: payload.new.user_id,
            user_name: payload.new.user_name || 'Unknown User',
            field_name: payload.new.field_name,
            old_value: payload.new.old_value,
            new_value: payload.new.new_value,
            change_type: payload.new.change_type,
            item_id: payload.new.item_id,
            item_description: payload.new.item_description
          };
          
          // Add new entry at the beginning (most recent first)
          return [newEntry, ...prev];
        });
      }
      
      // Follow up with full refresh for data consistency
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.rpc('get_qa_change_history', {
            p_inspection_id: inspectionId
          });
          if (error) throw error;
          
          console.log('Real-time fetch completed:', data?.length || 0, 'entries');
          setChangeHistory(data || []);
          lastRefresh.current = Date.now();
        } catch (error) {
          console.error('Real-time refresh failed:', error);
        }
      }, 50); // Very fast follow-up
    };

    // Create new subscription with unique channel name
    const channelName = `qa_change_history:${inspectionId}:${Date.now()}`;
    realtimeChannel.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_change_history',
          filter: `inspection_id=eq.${inspectionId}`
        },
        handleRealtimeInsert
      )
      .subscribe((status) => {
        console.log('QA change history subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to QA change history updates');
          subscriptionActive.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('QA change history subscription error');
          subscriptionActive.current = false;
        } else if (status === 'CLOSED') {
          console.log('QA change history subscription closed');
          subscriptionActive.current = false;
        }
      });

    } catch (subscriptionError) {
      console.error('Error setting up real-time subscriptions:', subscriptionError);
      subscriptionActive.current = false;
    }

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
      if (realtimeChannel.current) {
        console.log('Cleaning up QA change history subscription');
        try {
          supabase.removeChannel(realtimeChannel.current);
        } catch (cleanupError) {
          console.warn('Error during subscription cleanup:', cleanupError);
        }
        realtimeChannel.current = null;
        subscriptionActive.current = false;
      }
    };
  }, [inspectionId]); // Remove refreshChangeHistory dependency!

  // Initial load
  useEffect(() => {
    if (inspectionId) {
      console.log('Loading QA change history for inspection:', inspectionId);
      fetchChangeHistory(false);
    }
  }, [inspectionId, fetchChangeHistory]);

  return {
    changeHistory,
    isLoading,
    recordChange,
    refreshChangeHistory: () => refreshChangeHistory(false) // Manual refresh
  };
};
