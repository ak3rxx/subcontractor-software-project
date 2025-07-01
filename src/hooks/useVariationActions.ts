
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';

interface UseVariationActionsProps {
  variations: Variation[];
  createVariation: (data: any) => Promise<Variation | null>;
  updateVariation: (id: string, updates: Partial<Variation>) => Promise<Variation | null>;
  sendVariationEmail: (variationId: string) => Promise<boolean>;
}

export const useVariationActions = ({
  variations,
  createVariation,
  updateVariation,
  sendVariationEmail
}: UseVariationActionsProps) => {
  const { toast } = useToast();

  const handleCreateVariation = useCallback(async (data: any) => {
    const result = await createVariation(data);
    if (result) {
      toast({
        title: "Success",
        description: `Variation ${result.variation_number} created successfully`
      });
      return true;
    }
    return false;
  }, [createVariation, toast]);

  const handleUpdateVariation = useCallback(async (id: string, updates: any) => {
    const result = await updateVariation(id, updates);
    if (result) {
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
      return true;
    }
    return false;
  }, [updateVariation, toast]);

  const handleSendEmail = useCallback(async (variationId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation?.client_email) {
      toast({
        title: "Error",
        description: "No client email found for this variation",
        variant: "destructive"
      });
      return false;
    }

    const success = await sendVariationEmail(variationId);
    if (success) {
      toast({
        title: "Success",
        description: `Variation email sent to ${variation.client_email}`
      });
    }
    return success;
  }, [variations, sendVariationEmail, toast]);

  const handleUpdateFromModal = useCallback(async (id: string, updates: any) => {
    return await handleUpdateVariation(id, updates);
  }, [handleUpdateVariation]);

  return {
    handleCreateVariation,
    handleUpdateVariation,
    handleSendEmail,
    handleUpdateFromModal
  };
};
