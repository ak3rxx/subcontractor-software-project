import React, { memo, useState } from 'react';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';
import QABulkExport from './QABulkExport';
import QATrackerHeader from './tracker/QATrackerHeader';
import QATrackerStats from './tracker/QATrackerStats';
import QATrackerFilters from './tracker/QATrackerFilters';
import QATrackerTableOptimized from './tracker/QATrackerTableOptimized';
import QAMetricsDashboard from './analytics/QAMetricsDashboard';
import QAReportGenerator from './analytics/QAReportGenerator';
import { useQATrackerLogic } from './tracker/useQATrackerLogic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FileText, List } from 'lucide-react';

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
  const [showReportGenerator, setShowReportGenerator] = useState(false);
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

  if (showReportGenerator) {
    return (
      <QAReportGenerator
        projectId={projectId}
        onClose={() => setShowReportGenerator(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <QATrackerHeader onNewInspection={() => setShowCreateForm(true)} />
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">QA List</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-6">
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
          
          <QATrackerTableOptimized
            inspections={filteredInspections}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onView={handleViewInspection}
            onEdit={handleEditInspection}
            onDelete={handleDeleteInspection}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <QAMetricsDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <QAReportGenerator 
            projectId={projectId}
            onClose={() => setShowReportGenerator(false)}
          />
        </TabsContent>
      </Tabs>

      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          onUpdate={(updated) => {
            setSelectedInspection(updated);
          }}
        />
      )}
    </div>
  );
};

export default memo(QATrackerOptimized);