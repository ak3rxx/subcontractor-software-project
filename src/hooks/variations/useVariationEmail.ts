
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';
import { variationService } from '@/services/variationService';

export const useVariationEmail = (
  variations: Variation[],
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>
) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendVariationEmail = useCallback(async (variationId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return false;
    }

    const variation = variations.find(v => v.id === variationId);
    if (!variation) {
      toast({
        title: "Error",
        description: "Variation not found",
        variant: "destructive"
      });
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
      const message = error instanceof Error ? error.message : 'Failed to send variation email';
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      return false;
    }
  }, [user, variations, setVariations, toast]);

  return {
    sendVariationEmail
  };
};
