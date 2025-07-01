
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';

interface UseVariationActionHandlersProps {
  variations: Variation[];
  canEditVariations: boolean;
  canSendEmails: boolean;
  canCreateVariations: boolean;
  createVariation: (data: any) => Promise<Variation | null>;
  updateVariation: (id: string, updates: any) => Promise<Variation | null>;
  sendVariationEmail: (variationId: string) => Promise<boolean>;
  refreshVariations: () => Promise<void>;
  setShowForm: (show: boolean) => void;
  setEditingVariation: (variation: Variation | null) => void;
  setFormKey: (key: number) => void;
  setSelectedVariation: (variation: Variation | null) => void;
  setShowDetailsModal: (show: boolean) => void;
  formKey: number;
}

export const useVariationActionHandlers = ({
  variations,
  canEditVariations,
  canSendEmails,
  canCreateVariations,
  createVariation,
  updateVariation,
  sendVariationEmail,
  refreshVariations,
  setShowForm,
  setEditingVariation,
  setFormKey,
  setSelectedVariation,
  setShowDetailsModal,
  formKey
}: UseVariationActionHandlersProps) => {
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

  const handleUpdateVariation = useCallback(async (id: string, data: any) => {
    const result = await updateVariation(id, data);
    if (result) {
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
      return true;
    }
    return false;
  }, [updateVariation, toast]);

  const handleEdit = useCallback((variation: Variation) => {
    if (variation.status === 'pending_approval') {
      toast({
        title: "Cannot Edit",
        description: "This variation is pending approval and cannot be edited",
        variant: "destructive"
      });
      return;
    }

    if (!canEditVariations) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }
    
    setEditingVariation(variation);
    setShowForm(true);
    setFormKey(formKey + 1);
  }, [canEditVariations, setEditingVariation, setShowForm, setFormKey, formKey, toast]);

  const handleViewDetails = useCallback((variation: Variation) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  }, [setSelectedVariation, setShowDetailsModal]);

  const handleSendEmail = useCallback(async (variationId: string) => {
    if (!canSendEmails) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to send emails",
        variant: "destructive"
      });
      return false;
    }

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
  }, [variations, canSendEmails, sendVariationEmail, toast]);

  const handleUpdateFromModal = useCallback(async (id: string, updates: any) => {
    try {
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await updateVariation(id, updatePayload);
      await refreshVariations();
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  }, [updateVariation, refreshVariations]);

  const handleNewVariation = useCallback(() => {
    setEditingVariation(null);
    setFormKey(formKey + 1);
    setShowForm(true);
  }, [setEditingVariation, setFormKey, setShowForm, formKey]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingVariation(null);
    setFormKey(formKey + 1);
  }, [setShowForm, setEditingVariation, setFormKey, formKey]);

  const handleFormSubmit = useCallback(async (data: any) => {
    // This will be handled by the parent component
    return true;
  }, []);

  return {
    handleCreateVariation,
    handleUpdateVariation,
    handleEdit,
    handleViewDetails,
    handleSendEmail,
    handleUpdateFromModal,
    handleNewVariation,
    handleFormClose,
    handleFormSubmit
  };
};
