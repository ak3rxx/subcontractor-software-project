
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
  const { variations, loading, createVariation, updateVariation, sendVariationEmail, refreshVariations } = useVariations(projectId);
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin, canAccess } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

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

  // Enhanced update handler with real-time refresh
  const handleUpdateFromModalEnhanced = async (id: string, updates: any) => {
    try {
      await handleUpdateFromModal(id, updates);
      // Refresh variations to ensure UI is in sync
      await refreshVariations();
      // Update selected variation if it's the one being updated
      if (selectedVariation && selectedVariation.id === id) {
        const updatedVariation = variations.find(v => v.id === id);
        if (updatedVariation) {
          setSelectedVariation({ ...updatedVariation, ...updates });
        }
      }
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
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
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
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
        onCreateFirst={() => setShowForm(true)}
      />

      {/* Modals - Protected by permissions */}
      <PermissionGate module="variations" requiredLevel="write">
        <QuotationVariationForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingVariation(null);
          }}
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
