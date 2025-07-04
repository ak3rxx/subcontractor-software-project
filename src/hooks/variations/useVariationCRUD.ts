
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Variation, VariationFormData } from '@/types/variations';
import { variationService } from '@/services/variationService';

export const useVariationCRUD = (
  variations: Variation[],
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>,
  refetchVariations: () => Promise<void>
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createVariation = useCallback(async (formData: VariationFormData): Promise<Variation | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    try {
      const newVariation = await variationService.createVariation(
        variations[0]?.project_id || '',
        formData,
        user.id
      );
      
      // Optimistic update
      setVariations(prev => [newVariation, ...prev]);
      
      toast({
        title: "Success",
        description: `Variation ${newVariation.variation_number} created successfully`
      });
      
      return newVariation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create variation';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return null;
    }
  }, [user, variations, setVariations, toast]);

  const updateVariation = useCallback(async (id: string, updates: Partial<Variation>): Promise<Variation | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
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
      const message = error instanceof Error ? error.message : 'Failed to update variation';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      // Revert optimistic update on error
      await refetchVariations();
      return null;
    }
  }, [user, setVariations, refetchVariations, toast]);

  return {
    createVariation,
    updateVariation
  };
};
