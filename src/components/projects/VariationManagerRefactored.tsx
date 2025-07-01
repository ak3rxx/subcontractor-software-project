
import React, { useState } from 'react';
import { useVariationsRefactored } from '@/hooks/variations/useVariationsRefactored';
import { useVariationOptimizations } from '@/hooks/variations/useVariationOptimizations';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVariationActions } from '@/hooks/useVariationActions';
import { Variation } from '@/types/variations';

import VariationManagerHeader from './variations/sections/VariationManagerHeader';
import VariationSummaryCards from './variations/VariationSummaryCards';
import VariationManagerFilters from './variations/sections/VariationManagerFilters';
import VariationManagerTable from './variations/sections/VariationManagerTable';
import VariationManagerModals from './variations/sections/VariationManagerModals';
import VariationAnalytics from '../variations/analytics/VariationAnalytics';

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
  // Use refactored hooks
  const {
    variations,
    filteredVariations,
    loading,
    error,
    summary,
    createVariation,
    updateVariation,
    sendVariationEmail,
    refetch: refreshVariations,
    filters,
    updateFilter,
    setFilters
  } = useVariationsRefactored(projectId);

  // Performance optimizations
  const {
    variationMap,
    statusCounts,
    priorityCounts,
    getVariationById,
    getVariationsByStatus
  } = useVariationOptimizations(variations);

  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin, canAccess } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

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

  const handleUpdateVariation = async (id: string, data: any) => {
    const result = await updateVariation(id, data);
    return result !== null;
  };

  const handleCreateVariation = async (data: any) => {
    const result = await createVariation(data);
    return result !== null;
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
    await sendVariationEmail(variationId);
  };

  const handleUpdateFromModalEnhanced = async (id: string, updates: any) => {
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
      <VariationManagerHeader 
        onNewVariation={handleNewVariation}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <VariationSummaryCards 
        variations={variations} 
        summary={summary}
        statusCounts={statusCounts}
        priorityCounts={priorityCounts}
      />
      
      {activeTab === 'list' && (
        <>
          <VariationManagerFilters
            filters={filters}
            onFilterChange={updateFilter}
            onFiltersChange={setFilters}
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
        </>
      )}

      {activeTab === 'analytics' && (
        <VariationAnalytics variations={variations} />
      )}

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
