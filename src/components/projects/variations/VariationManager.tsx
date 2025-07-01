
import React from 'react';
import { VariationManagerLogic } from './VariationManagerLogic';
import { VariationManagerActions } from './VariationManagerActions';
import VariationManagerHeader from './sections/VariationManagerHeader';
import VariationSummaryCards from './VariationSummaryCards';
import VariationManagerFilters from './sections/VariationManagerFilters';
import VariationManagerTable from './sections/VariationManagerTable';
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

        return (
          <VariationManagerActions
            variations={variations}
            canEditVariations={canEditVariations}
            canSendEmails={canSendEmails}
            canCreateVariations={canCreateVariations}
            createVariation={createVariation}
            updateVariation={updateVariation}
            sendVariationEmail={sendVariationEmail}
            refreshVariations={refreshVariations}
            setShowForm={setShowForm}
            setEditingVariation={setEditingVariation}
            setFormKey={setFormKey}
            setSelectedVariation={setSelectedVariation}
            setShowDetailsModal={setShowDetailsModal}
            formKey={formKey}
          >
            {(actions) => {
              const {
                handleNewVariation,
                handleFormClose,
                handleEdit,
                handleViewDetails,
                handleSendEmailAction,
                handleUpdateFromModalEnhanced,
                handleVariationUpdate
              } = actions;

              const handleFormSubmit = async (data: any) => {
                const success = editingVariation 
                  ? await actions.handleUpdateVariation(editingVariation.id, data)
                  : await actions.handleCreateVariation(data);
                
                if (success) {
                  setShowForm(false);
                  setEditingVariation(null);
                  setFormKey(formKey + 1);
                }
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
            }}
          </VariationManagerActions>
        );
      }}
    </VariationManagerLogic>
  );
};

export default VariationManager;
