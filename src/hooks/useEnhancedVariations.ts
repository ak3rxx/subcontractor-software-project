import { useEffect } from 'react';
import { useVariationData } from '@/hooks/variations/useVariationData';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Variation, VariationFormData } from '@/types/variations';
import { variationService } from '@/services/variationService';

export const useEnhancedVariations = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { variations: serverVariations, loading, error, refetch } = useVariationData(projectId);
  
  const {
    items: variations,
    pendingActions,
    isPerformingAction,
    performOptimisticAction,
    updateItems,
    getPendingAction,
    hasPendingAction
  } = useOptimisticUpdates<Variation>(serverVariations, 'variations');

  // Update local state when server data changes
  useEffect(() => {
    updateItems(serverVariations);
  }, [serverVariations, updateItems]);

  const createVariation = async (formData: VariationFormData): Promise<Variation | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    // Create optimistic variation
    const optimisticVariation: Variation = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      variation_number: `VAR-${String(variations.length + 1).padStart(3, '0')}`,
      title: formData.title,
      description: formData.description || '',
      status: 'draft',
      priority: formData.priority || 'medium',
      category: formData.category || '',
      trade: formData.trade || '',
      cost_impact: formData.costImpact || 0,
      time_impact: formData.timeImpact || 0,
      location: formData.location || '',
      justification: formData.justification || '',
      requested_by: user.id,
      request_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // ... other required fields
    } as Variation;

    return performOptimisticAction(
      'create',
      optimisticVariation,
      () => variationService.createVariation(projectId, formData, user.id),
      {
        successMessage: `Variation ${optimisticVariation.variation_number} created successfully`,
        errorMessage: 'Failed to create variation',
        onSuccess: (serverVariation) => {
          // Update the optimistic item with server data
          updateItems(variations.map(v => 
            v.id === optimisticVariation.id ? serverVariation : v
          ));
        }
      }
    );
  };

  const updateVariation = async (id: string, updates: Partial<Variation>): Promise<Variation | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    const existingVariation = variations.find(v => v.id === id);
    if (!existingVariation) return null;

    const updatedVariation = { ...existingVariation, ...updates, updated_at: new Date().toISOString() };

    return performOptimisticAction(
      'update',
      updatedVariation,
      () => variationService.updateVariation(id, updates, user.id),
      {
        successMessage: `Variation ${existingVariation.variation_number} updated successfully`,
        errorMessage: 'Failed to update variation'
      }
    );
  };

  const changeVariationStatus = async (id: string, newStatus: string, comments?: string): Promise<Variation | null> => {
    const existingVariation = variations.find(v => v.id === id);
    if (!existingVariation) return null;

    const statusUpdate = {
      ...existingVariation,
      status: newStatus as any,
      approval_comments: comments,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'approved' && { approval_date: new Date().toISOString().split('T')[0] }),
      ...(newStatus === 'submitted' && { submitted_date: new Date().toISOString().split('T')[0] })
    };

    return performOptimisticAction(
      'status-change',
      statusUpdate,
      () => variationService.updateVariation(id, statusUpdate, user?.id || ''),
      {
        successMessage: `Variation ${existingVariation.variation_number} status changed to ${newStatus}`,
        errorMessage: 'Failed to update variation status'
      }
    );
  };

  const sendVariationEmail = async (variationId: string): Promise<boolean> => {
    return performOptimisticAction(
      'update',
      { ...variations.find(v => v.id === variationId)!, email_sent: true, email_sent_date: new Date().toISOString() },
      async () => {
        // Call email service
        const response = await fetch('/api/send-variation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variationId })
        });
        if (!response.ok) throw new Error('Failed to send email');
        return true;
      },
      {
        successMessage: 'Variation email sent successfully',
        errorMessage: 'Failed to send variation email'
      }
    ) !== null;
  };

  // Get status info for UI
  const getVariationStatusInfo = (variationId: string) => {
    const pendingAction = getPendingAction(variationId);
    const isUpdating = hasPendingAction(variationId);
    
    let statusMessage = '';
    if (pendingAction) {
      switch (pendingAction.type) {
        case 'create':
          statusMessage = 'Creating...';
          break;
        case 'update':
          statusMessage = 'Updating...';
          break;
        case 'status-change':
          statusMessage = `Changing to ${pendingAction.data.status}...`;
          break;
        case 'delete':
          statusMessage = 'Deleting...';
          break;
      }
    }

    return {
      isUpdating,
      statusMessage,
      pendingAction
    };
  };

  return {
    variations,
    loading,
    error,
    isPerformingAction,
    pendingActions,
    createVariation,
    updateVariation,
    changeVariationStatus,
    sendVariationEmail,
    getVariationStatusInfo,
    hasPendingAction,
    refetch
  };
};
