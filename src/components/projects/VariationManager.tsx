
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import PermissionGate from '@/components/PermissionGate';
import QuotationVariationForm from './variations/QuotationVariationForm';
import EnhancedVariationDetailsModalV2 from './variations/EnhancedVariationDetailsModalV2';
import VariationSummaryCards from './variations/VariationSummaryCards';
import VariationFilters from './variations/VariationFilters';
import VariationTable from './variations/VariationTable';
import { useVariationActions } from './variations/VariationActions';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
  crossModuleData?: any;
}

const VariationManager: React.FC<VariationManagerProps> = ({ projectName, projectId, crossModuleData }) => {
  // All hooks must be called at the top of the component
  const { variations, loading, createVariation, updateVariation, sendVariationEmail, refetch: refreshVariations } = useVariations(projectId);
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin, canAccess } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  // ADDED: Key to force form re-render and clear data
  const [formKey, setFormKey] = useState(0);

  // Call useVariationActions hook before any conditional logic
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

  // Log permission check results for debugging
  console.log('VariationManager permissions:', {
    isDeveloper: isDeveloper(),
    canEdit: canEdit('variations'),
    canAdmin: canAdmin('variations'),
    canAccess: canAccess('variations'),
    canCreateVariations,
    canEditVariations,
    canSendEmails,
    canViewVariations
  });

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
      // ADDED: Increment form key to force fresh form on next open
      setFormKey(prev => prev + 1);
    }
  };

  const handleEdit = (variation: any) => {
    // Check if variation is in pending approval status
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
    
    console.log('Editing variation:', variation);
    setEditingVariation(variation);
    setShowForm(true);
    // ADDED: Increment form key when editing to ensure proper form state
    setFormKey(prev => prev + 1);
  };

  const handleViewDetails = (variation: any) => {
    console.log('Viewing details for variation:', variation);
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

  // ENHANCED: Force refresh variations and update selected variation
  const handleUpdateFromModalEnhanced = async (id: string, updates: any) => {
    try {
      console.log('Updating variation with:', updates);
      
      await handleUpdateFromModal(id, updates);
      
      // Force refresh variations to ensure real-time sync
      await refreshVariations();
      
      // Update selected variation to reflect changes immediately
      if (selectedVariation && selectedVariation.id === id) {
        // Get the updated variation from the refreshed list
        const updatedVariations = await refreshVariations();
        const updatedVariation = variations.find(v => v.id === id);
        if (updatedVariation) {
          setSelectedVariation({ ...updatedVariation });
        }
      }
      
      console.log('Variation update completed successfully');
      
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  };

  // ENHANCED: New variation button with proper form reset
  const handleNewVariation = () => {
    setEditingVariation(null);
    setFormKey(prev => prev + 1); // Force form re-render with fresh state
    setShowForm(true);
  };

  // ENHANCED: Form close handler with proper cleanup
  const handleFormClose = () => {
    setShowForm(false);
    setEditingVariation(null);
    setFormKey(prev => prev + 1); // Ensure form is reset for next use
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
      />

      {/* Variations Table */}
      <VariationTable
        variations={filteredVariations}
        canEditVariations={canEditVariations}
        canSendEmails={canSendEmails}
        canCreateVariations={canCreateVariations}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        onSendEmail={handleSendEmailAction}
        onCreateFirst={handleNewVariation}
      />

      {/* Modals - Protected by permissions */}
      <PermissionGate module="variations" requiredLevel="write">
        <QuotationVariationForm
          key={formKey} // ADDED: Key to force re-render and clear form data
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
        onUpdate={handleUpdateFromModalEnhanced}
      />
    </div>
  );
};

export default VariationManager;
