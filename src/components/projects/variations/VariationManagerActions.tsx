
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';
import { useVariationEditPermissions } from '@/hooks/useVariationEditPermissions';

interface VariationManagerActionsProps {
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
  children: (actions: {
    handleFormSubmit: (data: any) => Promise<void>;
    handleUpdateVariation: (id: string, data: any) => Promise<boolean>;
    handleCreateVariation: (data: any) => Promise<boolean>;
    handleEdit: (variation: Variation) => void;
    handleViewDetails: (variation: Variation) => void;
    handleSendEmailAction: (variationId: string) => Promise<void>;
    handleUpdateFromModalEnhanced: (id: string, updates: any) => Promise<void>;
    handleVariationUpdate: (updatedVariation: Variation) => void;
    handleNewVariation: () => void;
    handleFormClose: () => void;
  }) => React.ReactNode;
}

export const VariationManagerActions: React.FC<VariationManagerActionsProps> = ({
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
  formKey,
  children
}) => {
  const { toast } = useToast();

  const handleFormSubmit = async (data: any) => {
    // This will be handled by the parent component
  };

  const handleUpdateVariation = async (id: string, data: any) => {
    const result = await updateVariation(id, data);
    return result !== null;
  };

  const handleCreateVariation = async (data: any) => {
    const result = await createVariation(data);
    return result !== null;
  };

  const handleEdit = (variation: Variation) => {
    // Always open the detail modal for editing (permission checks happen there)
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleViewDetails = (variation: Variation) => {
    setSelectedVariation(variation);
    setShowDetailsModal(true);
  };

  const handleSendEmailAction = async (variationId: string) => {
    if (!canSendEmails) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to send emails",
        variant: "destructive"
      });
      return;
    }
    await sendVariationEmail(variationId);
  };

  const handleUpdateFromModalEnhanced = async (id: string, updates: any) => {
    try {
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const updatedVariation = await updateVariation(id, updatePayload);
      
      // Always refresh the main variations list first to get latest data
      await refreshVariations();
      
      // Immediately update modal with fresh data (no setTimeout needed)
      if (updatedVariation) {
        // Use the returned variation which has the latest data from the database
        setSelectedVariation(updatedVariation);
      }
      
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  };

  const handleVariationUpdate = async (updatedVariation: Variation) => {
    // Refresh the main variations list first to get latest data
    await refreshVariations();
    
    // Update the selected variation to keep modal data fresh
    setSelectedVariation(updatedVariation);
  };

  const handleNewVariation = () => {
    setEditingVariation(null);
    setFormKey(formKey + 1);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVariation(null);
    setFormKey(formKey + 1);
  };

  return (
    <>
      {children({
        handleFormSubmit,
        handleUpdateVariation,
        handleCreateVariation,
        handleEdit,
        handleViewDetails,
        handleSendEmailAction,
        handleUpdateFromModalEnhanced,
        handleVariationUpdate,
        handleNewVariation,
        handleFormClose
      })}
    </>
  );
};
