
import { useState, useEffect, useCallback } from 'react';
import { Variation } from '@/types/variations';
import { variationService } from '@/services/variationService';
import { useToast } from '@/hooks/use-toast';

export const useVariationData = (projectId: string) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVariations = useCallback(async (forceRefresh = false) => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedVariations = await variationService.fetchVariations(projectId, forceRefresh);
      setVariations(fetchedVariations);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch variations';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchVariations();
  }, [fetchVariations]);

  return {
    variations,
    setVariations,
    loading,
    error,
    refetch: fetchVariations,
    clearError: () => setError(null)
  };
};
