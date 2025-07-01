
import React, { useState } from 'react';
import { useVariations } from '@/hooks/useVariations';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVariationActions } from '@/hooks/useVariationActions';
import { Variation } from '@/types/variations';

import VariationManagerHeader from './variations/sections/VariationManagerHeader';
import VariationSummaryCards from './variations/VariationSummaryCards';
import VariationManagerFilters from './variations/sections/VariationManagerFilters';
import VariationManagerTable from './variations/sections/VariationManagerTable';
import VariationManagerModals from './variations/sections/VariationManagerModals';

interface VariationManagerRefactoredProps {
  projectName: string;
  projectId: string;
  crossModuleData?: any;
}

const VariationManagerRefactored: React.FC<VariationManagerRefactoredProps> = ({ 
  projectName, 
  projectId, 
  crossModuleData 
}) => {
  const { variations, loading, createVariation, updateVariation, sendVariationEmail, refetch: refreshVariations } = useVariations(projectId);
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin, canAccess } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formKey, setFormKey] = useState(0);

  const {
    handleCreateVariation,
    handleUpdateVariation,
    handleSendEmail,
    handleUpdateFromModal
  } = useVariationActions({
    variations,
    createVariation,
    updateVariation,
    sendVariationEmail
  });

  // Enhanced permission checks using the permission system
  const canCreateVariations = isDeveloper() || canEdit('variations');
  const canEditVariations = isDeveloper() || canEdit('variations') || canAdmin('variations');
  const canSendEmails = isDeveloper() || canAdmin('variations');
  const canViewVariations = isDeveloper() || canAccess('variations');

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check permissions after all hooks are called
  if (!canViewVariations) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view variations.</p>
      </div>
    );
  }

  const filteredVariations = variations.filter(variation => {
    const matchesSearch = variation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variation.variation_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || variation.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || variation.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleFormSubmit = async (data: any) => {
    const success = editingVariation 
      ? await handleUpdateVariation(editingVariation.id, data)
      : await handleCreateVariation(data);
    
    if (success) {
      setShowForm(false);
      setEditingVariation(null);
      setFormKey(prev => prev + 1);
    }
  };

  const handleEdit = (variation: Variation) => {
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
    setFormKey(prev => prev + 1);
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
    await handleSendEmail(variationId);
  };

  const handleUpdateFromModalEnhanced = async (id: string, updates: any) => {
    try {
      const updatePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      await handleUpdateFromModal(id, updatePayload);
      await refreshVariations();
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  };

  const handleVariationUpdate = (updatedVariation: Variation) => {
    if (selectedVariation && selectedVariation.id === updatedVariation.id) {
      setSelectedVariation(updatedVariation);
    }
    refreshVariations();
  };

  const handleNewVariation = () => {
    setEditingVariation(null);
    setFormKey(prev => prev + 1);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVariation(null);
    setFormKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <VariationManagerHeader onNewVariation={handleNewVariation} />
      
      <VariationSummaryCards variations={variations} />
      
      <VariationManagerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />
      
      <VariationManagerTable
        variations={filteredVariations}
        canEditVariations={canEditVariations}
        canSendEmails={canSendEmails}
        canCreateVariations={canCreateVariations}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onSendEmail={handleSendEmailAction}
        onCreateFirst={handleNewVariation}
      />

      <VariationManagerModals
        showForm={showForm}
        onFormClose={handleFormClose}
        onFormSubmit={handleFormSubmit}
        projectName={projectName}
        editingVariation={editingVariation}
        formKey={formKey}
        selectedVariation={selectedVariation}
        showDetailsModal={showDetailsModal}
        onDetailsModalClose={() => {
          setShowDetailsModal(false);
          setSelectedVariation(null);
        }}
        onUpdateFromModal={handleUpdateFromModalEnhanced}
        onVariationUpdate={handleVariationUpdate}
      />
    </div>
  );
};

export default VariationManagerRefactored;
