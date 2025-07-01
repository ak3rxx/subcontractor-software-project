
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Variation, VariationFormData, VariationError } from '@/types/variations';
import { variationService } from '@/services/variationService';

export const useVariationsRefactored = (projectId: string) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error('Variation operation error:', error);
    
    let message = defaultMessage;
    if (error instanceof VariationError) {
      message = error.message;
    }
    
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }, [toast]);

  const fetchVariations = useCallback(async (forceRefresh = false) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedVariations = await variationService.fetchVariations(projectId, forceRefresh);
      setVariations(fetchedVariations);
    } catch (error) {
      handleError(error, 'Failed to fetch variations');
    } finally {
      setLoading(false);
    }
  }, [projectId, handleError]);

  const createVariation = useCallback(async (formData: VariationFormData): Promise<Variation | null> => {
    if (!user || !projectId) {
      handleError(new Error('User not authenticated'), 'User not authenticated');
      return null;
    }

    try {
      const newVariation = await variationService.createVariation(projectId, formData, user.id);
      
      // Optimistic update
      setVariations(prev => [newVariation, ...prev]);
      
      toast({
        title: "Success",
        description: `Variation ${newVariation.variation_number} created successfully`
      });
      
      return newVariation;
    } catch (error) {
      handleError(error, 'Failed to create variation');
      return null;
    }
  }, [user, projectId, handleError, toast]);

  const updateVariation = useCallback(async (id: string, updates: Partial<Variation>): Promise<Variation | null> => {
    if (!user) {
      handleError(new Error('User not authenticated'), 'User not authenticated');
      return null;
    }

    try {
      const updatedVariation = await variationService.updateVariation(id, updates, user.id);
      
      // Optimistic update
      setVariations(prev => 
        prev.map(variation => 
          variation.id === id ? updatedVariation : variation
        )
      );
      
      return updatedVariation;
    } catch (error) {
      handleError(error, 'Failed to update variation');
      // Revert optimistic update on error
      await fetchVariations(true);
      return null;
    }
  }, [user, handleError, fetchVariations]);

  const sendVariationEmail = useCallback(async (variationId: string): Promise<boolean> => {
    if (!user) {
      handleError(new Error('User not authenticated'), 'User not authenticated');
      return false;
    }

    const variation = variations.find(v => v.id === variationId);
    if (!variation) {
      handleError(new Error('Variation not found'), 'Variation not found');
      return false;
    }

    try {
      const success = await variationService.sendVariationEmail(variation, user.id);
      
      if (success) {
        // Update local state
        setVariations(prev => 
          prev.map(v => 
            v.id === variationId 
              ? { 
                  ...v, 
                  email_sent: true, 
                  email_sent_date: new Date().toISOString(),
                  email_sent_by: user.id 
                }
              : v
          )
        );
        
        toast({
          title: "Success",
          description: `Variation email sent to ${variation.client_email}`
        });
      }
      
      return success;
    } catch (error) {
      handleError(error, 'Failed to send variation email');
      return false;
    }
  }, [user, variations, handleError, toast]);

  // Initial fetch
  useEffect(() => {
    fetchVariations();
  }, [fetchVariations]);

  return {
    variations,
    loading,
    error,
    createVariation,
    updateVariation,
    sendVariationEmail,
    refetch: fetchVariations,
    clearError: () => setError(null)
  };
};
