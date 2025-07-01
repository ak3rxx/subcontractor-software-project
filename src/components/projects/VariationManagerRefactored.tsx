
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVariationsRefactored } from '@/hooks/useVariationsRefactored';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import PermissionGate from '@/components/PermissionGate';
import QuotationVariationForm from './variations/QuotationVariationForm';
import EnhancedVariationDetailsModalV2 from './variations/EnhancedVariationDetailsModalV2';
import VariationSummaryCards from './variations/VariationSummaryCards';
import VariationFilters from './variations/VariationFilters';
import VariationList from './variations/list/VariationList';
import { VariationFilters as IVariationFilters, Variation } from '@/types/variations';

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
  const { variations, loading, createVariation, updateVariation, sendVariationEmail, refetch } = useVariationsRefactored(projectId);
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin, canAccess } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [formKey, setFormKey] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<IVariationFilters>({
    searchTerm: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    categoryFilter: 'all',
    tradeFilter: 'all'
  });

  // Enhanced permission checks
  const canCreateVariations = isDeveloper() || canEdit('variations');
  const canEditVariations = isDeveloper() || canEdit('variations') || canAdmin('variations');
  const canSendEmails = isDeveloper() || canAdmin('variations');
  const canViewVariations = isDeveloper() || canAccess('variations');

  // Check permissions early
  if (!canViewVariations) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view variations.</p>
      </div>
    );
  }

  const handleFormSubmit = async (data: any) => {
    const variation = editingVariation 
      ? await updateVariation(editingVariation.id, data)
      : await createVariation(data);
    
    if (variation) {
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
    await sendVariationEmail(variationId);
  };

  const handleUpdateFromModal = async (id: string, updates: any) => {
    try {
      const updatedVariation = await updateVariation(id, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      if (updatedVariation && selectedVariation && selectedVariation.id === id) {
        setSelectedVariation(updatedVariation);
      }
      
      await refetch();
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Variations</h2>
          <p className="text-gray-600">Manage project variations and change orders</p>
        </div>
        <PermissionGate module="variations" requiredLevel="write">
          <Button onClick={handleNewVariation} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Variation
          </Button>
        </PermissionGate>
      </div>

      {/* Summary Cards */}
      <VariationSummaryCards variations={variations} />

      {/* Filters */}
      <VariationFilters
        searchTerm={filters.searchTerm}
        setSearchTerm={(term) => setFilters(prev => ({ ...prev, searchTerm: term }))}
        statusFilter={filters.statusFilter}
        setStatusFilter={(status) => setFilters(prev => ({ ...prev, statusFilter: status }))}
        priorityFilter={filters.priorityFilter}
        setPriorityFilter={(priority) => setFilters(prev => ({ ...prev, priorityFilter: priority }))}
      />

      {/* Variations List */}
      <VariationList
        variations={variations}
        loading={loading}
        filters={filters}
        onItemClick={handleViewDetails}
        onEdit={handleEdit}
        onSendEmail={handleSendEmailAction}
        onCreateFirst={handleNewVariation}
        canEdit={canEditVariations}
        canSendEmails={canSendEmails}
      />

      {/* Modals */}
      <PermissionGate module="variations" requiredLevel="write">
        <QuotationVariationForm
          key={formKey}
          isOpen={showForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          projectName={projectName}
          editingVariation={editingVariation}
        />
      </PermissionGate>

      <EnhancedVariationDetailsModalV2
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVariation(null);
        }}
        onUpdate={handleUpdateFromModal}
        onVariationUpdate={(updatedVariation) => {
          if (selectedVariation && selectedVariation.id === updatedVariation.id) {
            setSelectedVariation(updatedVariation);
          }
          refetch();
        }}
      />
    </div>
  );
};

export default VariationManagerRefactored;
