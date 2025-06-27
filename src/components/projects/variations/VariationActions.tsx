
import React from 'react';
import { useToast } from '@/hooks/use-toast';

interface VariationActionsProps {
  variations: any[];
  createVariation: (data: any) => Promise<any>;
  updateVariation: (id: string, data: any) => Promise<any>;
  sendVariationEmail: (id: string) => Promise<boolean>;
}

export const useVariationActions = ({
  variations,
  createVariation,
  updateVariation,
  sendVariationEmail
}: VariationActionsProps) => {
  const { toast } = useToast();

  const handleCreateVariation = async (data: any) => {
    try {
      console.log('Creating variation with data:', data);
      await createVariation(data);
      toast({
        title: "Success",
        description: "Variation created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating variation:', error);
      toast({
        title: "Error",
        description: "Failed to create variation",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleUpdateVariation = async (id: string, data: any) => {
    try {
      console.log('Updating variation with data:', data);
      await updateVariation(id, data);
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating variation:', error);
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSendEmail = async (variationId: string) => {
    try {
      const success = await sendVariationEmail(variationId);
      if (success) {
        toast({
          title: "Success",
          description: "Variation email sent successfully"
        });
      }
      return success;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send variation email",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleUpdateFromModal = async (id: string, updates: any): Promise<void> => {
    try {
      console.log('Updating variation from modal:', id, updates);
      const result = await updateVariation(id, updates);
      if (result) {
        toast({
          title: "Success",
          description: "Variation updated successfully"
        });
      }
    } catch (error) {
      console.error('Error updating variation from modal:', error);
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    }
  };

  return {
    handleCreateVariation,
    handleUpdateVariation,
    handleSendEmail,
    handleUpdateFromModal
  };
};
