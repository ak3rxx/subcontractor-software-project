
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
import { useQATrackerLogic } from './tracker/useQATrackerLogic';
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading QA inspections...</span>
      </div>
    );
  }

  // Form states
  if (showCreateForm) {
    return (
      <QAITPForm
        projectId={projectId}
        onClose={() => {
          setShowCreateForm(false);
          refetch();
          onNavigateToTracker?.();
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

  // Navigation buttons
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
        Action&Task List
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

  // Render current view
  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'dashboard':
          return <QAMetricsDashboard projectId={projectId} />;
        
        case 'qa-list':
          return (
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
          );
        
        case 'actions':
          return <QAActionTaskList projectId={projectId} />;
        
        case 'reports':
          return (
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
          );
        
        default:
          return <QAMetricsDashboard projectId={projectId} />;
      }
    } catch (error) {
      console.error('QATrackerOptimized: View rendering error:', error);
      return (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                This section is temporarily unavailable. Please try refreshing the page.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-6">
      <QATrackerHeader onNewInspection={() => setShowCreateForm(true)} />
      
      <NavigationButtons />
      
      {renderCurrentView()}

      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => {
            console.log('QA Modal Debug: Closing modal');
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
          onUpdate={(updated) => {
            console.log('QA Modal Debug: Inspection updated:', updated.id);
            setSelectedInspection(updated);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default memo(QATrackerOptimized);
