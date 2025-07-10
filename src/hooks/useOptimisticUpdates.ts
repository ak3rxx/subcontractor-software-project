import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface OptimisticAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'status-change';
  data: T;
  originalData?: T;
  timestamp: number;
  module: 'variations' | 'tasks' | 'rfis' | 'qa' | 'finance';
  status: 'pending' | 'success' | 'error' | 'rolling-back';
  error?: string;
}

export interface OptimisticState<T> {
  items: T[];
  pendingActions: OptimisticAction<T>[];
  isPerformingAction: boolean;
}

export const useOptimisticUpdates = <T extends { id: string }>(
  initialItems: T[],
  module: OptimisticAction<T>['module']
) => {
  const { toast } = useToast();
  const [state, setState] = useState<OptimisticState<T>>({
    items: initialItems,
    pendingActions: [],
    isPerformingAction: false
  });
  const actionIdRef = useRef(0);

  const generateActionId = useCallback(() => {
    return `${module}-action-${++actionIdRef.current}-${Date.now()}`;
  }, [module]);

  // Apply optimistic update immediately
  const performOptimisticAction = useCallback(async <R>(
    actionType: OptimisticAction<T>['type'],
    data: T,
    serverAction: () => Promise<R>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      skipToast?: boolean;
      onSuccess?: (result: R) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<R | null> => {
    const actionId = generateActionId();
    const originalData = actionType === 'update' ? state.items.find(item => item.id === data.id) : undefined;
    
    const action: OptimisticAction<T> = {
      id: actionId,
      type: actionType,
      data,
      originalData,
      timestamp: Date.now(),
      module,
      status: 'pending'
    };

    // Immediately apply optimistic update
    setState(prev => {
      let newItems = [...prev.items];
      
      switch (actionType) {
        case 'create':
          newItems.unshift(data);
          break;
        case 'update':
          newItems = newItems.map(item => item.id === data.id ? { ...item, ...data } : item);
          break;
        case 'delete':
          newItems = newItems.filter(item => item.id !== data.id);
          break;
        case 'status-change':
          newItems = newItems.map(item => item.id === data.id ? { ...item, ...data } : item);
          break;
      }

      return {
        ...prev,
        items: newItems,
        pendingActions: [...prev.pendingActions, action],
        isPerformingAction: true
      };
    });

    try {
      // Perform server action
      const result = await serverAction();
      
      // Mark action as successful
      setState(prev => ({
        ...prev,
        pendingActions: prev.pendingActions.map(a => 
          a.id === actionId ? { ...a, status: 'success' } : a
        ),
        isPerformingAction: prev.pendingActions.filter(a => a.id !== actionId && a.status === 'pending').length > 0
      }));

      // Show success toast
      if (!options?.skipToast && options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage
        });
      }

      options?.onSuccess?.(result);

      // Clean up successful action after a delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(a => a.id !== actionId)
        }));
      }, 3000);

      return result;
    } catch (error) {
      console.error('Optimistic action failed:', error);
      
      // Mark action as failed and rollback
      setState(prev => {
        const failedAction = prev.pendingActions.find(a => a.id === actionId);
        if (!failedAction) return prev;

        let rolledBackItems = [...prev.items];
        
        // Rollback the optimistic change
        switch (actionType) {
          case 'create':
            rolledBackItems = rolledBackItems.filter(item => item.id !== data.id);
            break;
          case 'update':
            if (originalData) {
              rolledBackItems = rolledBackItems.map(item => 
                item.id === data.id ? originalData : item
              );
            }
            break;
          case 'delete':
            if (originalData) {
              const index = prev.items.findIndex(item => item.id === data.id);
              rolledBackItems.splice(index >= 0 ? index : rolledBackItems.length, 0, originalData);
            }
            break;
          case 'status-change':
            if (originalData) {
              rolledBackItems = rolledBackItems.map(item => 
                item.id === data.id ? originalData : item
              );
            }
            break;
        }

        return {
          ...prev,
          items: rolledBackItems,
          pendingActions: prev.pendingActions.map(a => 
            a.id === actionId 
              ? { ...a, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
              : a
          ),
          isPerformingAction: prev.pendingActions.filter(a => a.id !== actionId && a.status === 'pending').length > 0
        };
      });

      // Show error toast
      if (!options?.skipToast) {
        toast({
          title: "Error",
          description: options?.errorMessage || 'Operation failed and has been reverted',
          variant: "destructive"
        });
      }

      options?.onError?.(error instanceof Error ? error : new Error('Unknown error'));

      // Clean up failed action after a delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.filter(a => a.id !== actionId)
        }));
      }, 5000);

      return null;
    }
  }, [generateActionId, module, state.items, toast]);

  // Update items from external source (e.g., real-time updates)
  const updateItems = useCallback((newItems: T[]) => {
    setState(prev => ({
      ...prev,
      items: newItems
    }));
  }, []);

  // Get pending action for specific item
  const getPendingAction = useCallback((itemId: string) => {
    return state.pendingActions.find(action => 
      action.data.id === itemId && action.status === 'pending'
    );
  }, [state.pendingActions]);

  // Check if item has pending action
  const hasPendingAction = useCallback((itemId: string) => {
    return state.pendingActions.some(action => 
      action.data.id === itemId && action.status === 'pending'
    );
  }, [state.pendingActions]);

  // Get all pending actions by type
  const getPendingActionsByType = useCallback((type: OptimisticAction<T>['type']) => {
    return state.pendingActions.filter(action => action.type === type && action.status === 'pending');
  }, [state.pendingActions]);

  return {
    items: state.items,
    pendingActions: state.pendingActions,
    isPerformingAction: state.isPerformingAction,
    performOptimisticAction,
    updateItems,
    getPendingAction,
    hasPendingAction,
    getPendingActionsByType
  };
};