
import React, { memo, useState } from 'react';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';
import QABulkExport from './QABulkExport';
import QATrackerHeader from './tracker/QATrackerHeader';
import QATrackerStats from './tracker/QATrackerStats';
import QATrackerFilters from './tracker/QATrackerFilters';
import QATrackerTable from './tracker/QATrackerTable';
import QAMetricsDashboard from './analytics/QAMetricsDashboard';
import QAReportGenerator from './analytics/QAReportGenerator';
import QAActionTaskList from './QAActionTaskList';
import NavigationErrorBoundary from '@/components/NavigationErrorBoundary';
import { useQATrackerLogic } from './tracker/useQATrackerLogic';
import { useAutoTaskCreation } from '@/hooks/useAutoTaskCreation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, List, CheckSquare, ArrowLeft } from 'lucide-react';

interface QATrackerProps {
  projectId: string;
  onNewInspection?: () => void;
  onNavigateToTracker?: () => void;
}

type QAView = 'dashboard' | 'qa-list' | 'actions' | 'reports';

const QATrackerOptimized: React.FC<QATrackerProps> = ({ 
  projectId,
  onNewInspection,
  onNavigateToTracker
}) => {
  const [currentView, setCurrentView] = useState<QAView>('dashboard');
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  
  const {
    loading,
    filteredInspections,
    statusCounts,
    uniqueInspectors,
    uniqueBuildings,
    uniqueLevels,
    uniqueTasks,
    uniqueTrades,
    showCreateForm,
    setShowCreateForm,
    selectedInspection,
    setSelectedInspection,
    selectedItems,
    showBulkExport,
    setShowBulkExport,
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
    handleSelectItem,
    handleSelectAll,
    handleBulkDelete,
    handleViewInspection,
    handleEditInspection,
    handleDeleteInspection,
    clearFilters,
    getStatusIcon,
    getStatusColor,
    refetch
  } = useQATrackerLogic(projectId);

  // Enable auto-task creation for QA failed inspections
  const { createFailedQATask } = useAutoTaskCreation({ 
    enabled: true, 
    projectId 
  });

  // Safe loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading QA inspections...</span>
      </div>
    );
  }

  // Safe form states
  if (showCreateForm) {
    return (
      <NavigationErrorBoundary>
        <QAITPForm
          projectId={projectId}
          onClose={() => {
            setShowCreateForm(false);
            refetch();
            onNavigateToTracker?.();
          }}
        />
      </NavigationErrorBoundary>
    );
  }

  if (showBulkExport) {
    return (
      <NavigationErrorBoundary>
        <QABulkExport
          selectedInspectionIds={Array.from(selectedItems)}
          onClose={() => setShowBulkExport(false)}
        />
      </NavigationErrorBoundary>
    );
  }

  if (showReportGenerator) {
    return (
      <NavigationErrorBoundary>
        <QAReportGenerator
          projectId={projectId}
          onClose={() => setShowReportGenerator(false)}
        />
      </NavigationErrorBoundary>
    );
  }

  // Safe navigation buttons
  const NavigationButtons = () => (
    <div className="flex gap-2 mb-6">
      <Button
        variant={currentView === 'dashboard' ? 'default' : 'outline'}
        onClick={() => setCurrentView('dashboard')}
        className="flex items-center gap-2"
      >
        <BarChart3 className="h-4 w-4" />
        Dashboard
      </Button>
      <Button
        variant={currentView === 'qa-list' ? 'default' : 'outline'}
        onClick={() => setCurrentView('qa-list')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        QA&ITP List
      </Button>
      <Button
        variant={currentView === 'actions' ? 'default' : 'outline'}
        onClick={() => setCurrentView('actions')}
        className="flex items-center gap-2"
      >
        <CheckSquare className="h-4 w-4" />
        Actions
      </Button>
      <Button
        variant={currentView === 'reports' ? 'default' : 'outline'}
        onClick={() => setCurrentView('reports')}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Reports
      </Button>
    </div>
  );

  // Safe view rendering with error boundaries
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <NavigationErrorBoundary>
            <QAMetricsDashboard projectId={projectId} />
          </NavigationErrorBoundary>
        );
      
      case 'qa-list':
        return (
          <NavigationErrorBoundary>
            <div className="space-y-6">
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
            </div>
          </NavigationErrorBoundary>
        );
      
      case 'actions':
        return (
          <NavigationErrorBoundary>
            <QAActionTaskList projectId={projectId} />
          </NavigationErrorBoundary>
        );
      
      case 'reports':
        return (
          <NavigationErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>QA Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowReportGenerator(true)}
                    className="w-full"
                  >
                    Generate QA Report
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Generate comprehensive QA reports with inspection summaries, trends, and recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </NavigationErrorBoundary>
        );
      
      default:
        return (
          <NavigationErrorBoundary>
            <QAMetricsDashboard projectId={projectId} />
          </NavigationErrorBoundary>
        );
    }
  };

  return (
    <NavigationErrorBoundary>
      <div className="space-y-6">
        <QATrackerHeader onNewInspection={() => setShowCreateForm(true)} />
        
        <NavigationButtons />
        
        {renderCurrentView()}

        {selectedInspection && (
          <QAInspectionModal
            isOpen={!!selectedInspection}
            onClose={() => {
              console.log('QA Modal: Closing modal safely');
              setSelectedInspection(null);
            }}
            inspection={selectedInspection}
            onUpdate={(updated) => {
              console.log('QA Modal: Inspection updated safely:', updated.id);
              setSelectedInspection(updated);
              refetch();
            }}
          />
        )}
      </div>
    </NavigationErrorBoundary>
  );
};

export default memo(QATrackerOptimized);
