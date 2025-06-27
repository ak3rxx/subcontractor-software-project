
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVariations } from '@/hooks/useVariations';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import QuotationVariationForm from './variations/QuotationVariationForm';
import EnhancedVariationDetailsModal from './variations/EnhancedVariationDetailsModal';
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
  const { variations, loading, createVariation, updateVariation, sendVariationEmail } = useVariations(projectId);
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Permission checks - developers have full access
  const canCreateVariations = isDeveloper() || canEdit('variations');
  const canEditVariations = isDeveloper() || canEdit('variations') || canAdmin('variations');
  const canSendEmails = isDeveloper() || canAdmin('variations');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Variations</h2>
          <p className="text-gray-600">Manage project variations and change orders</p>
        </div>
        {canCreateVariations && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Variation
          </Button>
        )}
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

      {/* Modals */}
      {canCreateVariations && (
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
      )}

      <EnhancedVariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVariation(null);
        }}
        onUpdate={handleUpdateFromModal}
      />
    </div>
  );
};

export default VariationManager;
