import React, { memo } from 'react';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';
import QABulkExport from './QABulkExport';
import QATrackerHeader from './tracker/QATrackerHeader';
import QATrackerStats from './tracker/QATrackerStats';
import QATrackerFilters from './tracker/QATrackerFilters';
import QATrackerTable from './tracker/QATrackerTable';
import { useQATrackerLogic } from './tracker/useQATrackerLogic';

interface QATrackerProps {
  projectId: string;
  onNewInspection?: () => void;
  onNavigateToTracker?: () => void;
}

const QATrackerOptimized: React.FC<QATrackerProps> = ({ 
  projectId,
  onNewInspection,
  onNavigateToTracker
}) => {
  const {
    // Data
    loading,
    filteredInspections,
    statusCounts,
    uniqueInspectors,
    uniqueBuildings,
    uniqueLevels,
    uniqueTasks,
    uniqueTrades,

    // UI State
    showCreateForm,
    setShowCreateForm,
    selectedInspection,
    setSelectedInspection,
    selectedItems,
    showBulkExport,
    setShowBulkExport,

    // Filter State
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    inspectionTypeFilter,
    setInspectionTypeFilter,
    templateTypeFilter,
    setTemplateTypeFilter,
    inspectorFilter,
    setInspectorFilter,
    dateRangeFilter,
    setDateRangeFilter,
    buildingFilter,
    setBuildingFilter,
    levelFilter,
    setLevelFilter,
    taskFilter,
    setTaskFilter,
    tradeFilter,
    setTradeFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    hasActiveFilters,

    // Event Handlers
    handleSelectItem,
    handleSelectAll,
    handleBulkDelete,
    handleViewInspection,
    handleEditInspection,
    handleDeleteInspection,
    clearFilters,

    // Utility Functions
    getStatusIcon,
    getStatusColor,

    // Other
    refetch
  } = useQATrackerLogic(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading QA inspections...</span>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <QAITPForm
        projectId={projectId}
        onClose={() => {
          setShowCreateForm(false);
          refetch(); // Refresh data to show new inspection
          onNavigateToTracker?.(); // Navigate back to QA tracker tab
        }}
      />
    );
  }

  if (showBulkExport) {
    return (
      <QABulkExport
        selectedInspectionIds={Array.from(selectedItems)}
        onClose={() => setShowBulkExport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <QATrackerHeader onNewInspection={() => setShowCreateForm(true)} />
      
      <QATrackerStats statusCounts={statusCounts} />
      
      <QATrackerFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        inspectionTypeFilter={inspectionTypeFilter}
        setInspectionTypeFilter={setInspectionTypeFilter}
        templateTypeFilter={templateTypeFilter}
        setTemplateTypeFilter={setTemplateTypeFilter}
        inspectorFilter={inspectorFilter}
        setInspectorFilter={setInspectorFilter}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={setDateRangeFilter}
        buildingFilter={buildingFilter}
        setBuildingFilter={setBuildingFilter}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        taskFilter={taskFilter}
        setTaskFilter={setTaskFilter}
        tradeFilter={tradeFilter}
        setTradeFilter={setTradeFilter}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        statusCounts={statusCounts}
        uniqueInspectors={uniqueInspectors}
        uniqueBuildings={uniqueBuildings}
        uniqueLevels={uniqueLevels}
        uniqueTasks={uniqueTasks}
        uniqueTrades={uniqueTrades}
      />
      
      <QATrackerTable
        filteredInspections={filteredInspections}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onViewInspection={handleViewInspection}
        onEditInspection={handleEditInspection}
        onDeleteInspection={handleDeleteInspection}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        hasActiveFilters={hasActiveFilters}
        onNewInspection={() => setShowCreateForm(true)}
        onExportSelected={() => setShowBulkExport(true)}
        onBulkDelete={handleBulkDelete}
      />

      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          onUpdate={(updated) => {
            setSelectedInspection(updated);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default memo(QATrackerOptimized);