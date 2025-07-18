
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChangeHistoryEntry {
  id: string;
  timestamp?: string;
  change_timestamp?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Enhanced deduplication tracking
  const recordedChanges = useRef<Set<string>>(new Set());
  const lastRefresh = useRef<number>(0);

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

  // Debounced refresh function to prevent excessive refetches
  const debouncedRefresh = useRef<NodeJS.Timeout>();
  const refreshChangeHistory = useCallback(() => {
    // Only refresh if enough time has passed since last refresh
    const timeSinceLastRefresh = Date.now() - lastRefresh.current;
    if (timeSinceLastRefresh < 2000) { // Minimum 2 seconds between refreshes
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }

    if (debouncedRefresh.current) {
      clearTimeout(debouncedRefresh.current);
    }
    
    debouncedRefresh.current = setTimeout(() => {
      console.log('Refreshing change history after debounce');
      fetchChangeHistory();
    }, 500); // 500ms debounce
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
      
      // Use debounced refresh instead of immediate refresh
      refreshChangeHistory();
      
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
  }, [inspectionId, toast, generateChangeKey, refreshChangeHistory]);

  // Initial load
  useEffect(() => {
    if (inspectionId) {
      console.log('Loading QA change history for inspection:', inspectionId);
      fetchChangeHistory();
    }
  }, [inspectionId, fetchChangeHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedRefresh.current) {
        clearTimeout(debouncedRefresh.current);
      }
    };
  }, []);

  return {
    changeHistory,
    isLoading,
    recordChange,
    refreshChangeHistory: fetchChangeHistory // Direct refresh for manual use
  };
};
