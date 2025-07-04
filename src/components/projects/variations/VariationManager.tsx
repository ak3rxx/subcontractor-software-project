
import React, { memo } from 'react';
import { VariationManagerLogic } from './VariationManagerLogic';
import { useVariationActionHandlers } from '@/hooks/variations/useVariationActionHandlers';
import VariationManagerHeader from './sections/VariationManagerHeader';
import VariationSummaryCards from './VariationSummaryCards';
import VariationManagerFilters from './sections/VariationManagerFilters';
import VariationTable from './VariationTable';
import VariationManagerModals from './sections/VariationManagerModals';
import VariationAnalytics from '../../variations/analytics/VariationAnalytics';

interface VariationManagerProps {
  projectName: string;
  projectId: string;
  crossModuleData?: any;
}

const VariationManager: React.FC<VariationManagerProps> = ({ 
  projectName, 
  projectId, 
  crossModuleData 
}) => {
  return (
    <VariationManagerLogic projectId={projectId}>
      {(logicProps) => {
        const {
          variations,
          filteredVariations,
          loading,
          error,
          summary,
          statusCounts,
          priorityCounts,
          createVariation,
          updateVariation,
          sendVariationEmail,
          refreshVariations,
          filters,
          updateFilter,
          setFilters,
          canCreateVariations,
          canEditVariations,
          canSendEmails,
          canViewVariations,
          showForm,
          setShowForm,
          selectedVariation,
          setSelectedVariation,
          showDetailsModal,
          setShowDetailsModal,
          editingVariation,
          setEditingVariation,
          formKey,
          setFormKey,
          activeTab,
          setActiveTab
        } = logicProps;

        const actionHandlers = useVariationActionHandlers({
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

        const handleFormSubmit = async (data: any) => {
          const success = editingVariation 
            ? await actionHandlers.handleUpdateVariation(editingVariation.id, data)
            : await actionHandlers.handleCreateVariation(data);
          
          if (success) {
            setShowForm(false);
            setEditingVariation(null);
            setFormKey(formKey + 1);
          }
        };

        return (
          <div className="space-y-6">
            <VariationManagerHeader 
              onNewVariation={actionHandlers.handleNewVariation}
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
                
                <VariationTable
                  variations={filteredVariations}
                  canEditVariations={canEditVariations}
                  canSendEmails={canSendEmails}
                  canCreateVariations={canCreateVariations}
                  onViewDetails={actionHandlers.handleViewDetails}
                  onEdit={actionHandlers.handleEdit}
                  onSendEmail={actionHandlers.handleSendEmail}
                  onCreateFirst={actionHandlers.handleNewVariation}
                />
              </>
            )}

            {activeTab === 'analytics' && (
              <VariationAnalytics variations={variations} />
            )}

            <VariationManagerModals
              showForm={showForm}
              onFormClose={actionHandlers.handleFormClose}
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
              onUpdateFromModal={actionHandlers.handleUpdateFromModal}
              onVariationUpdate={() => refreshVariations()}
            />
          </div>
        );
      }}
    </VariationManagerLogic>
  );
};

export default memo(VariationManager);
