import React, { useState, useMemo, useCallback } from 'react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQAPermissions } from '@/hooks/useQAPermissions';

export const useQATrackerLogic = (projectId: string) => {
  const { inspections, loading, deleteInspection, refetch } = useQAInspectionsSimple(projectId);
  const { user } = useAuth();
  const { toast } = useToast();
  const qaPermissions = useQAPermissions();

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkExport, setShowBulkExport] = useState(false);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState('all');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('all');
  const [inspectorFilter, setInspectorFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // PERFORMANCE OPTIMIZATION: Use deferred values for expensive computations
  const deferredInspections = React.useDeferredValue(inspections);
  
  // Optimized memoized computations - single pass through data
  const computedData = useMemo(() => {
    const statusCounts = { total: 0, pass: 0, fail: 0, 'pending-reinspection': 0, 'incomplete-in-progress': 0, 'incomplete-draft': 0 };
    const inspectors = new Set<string>();
    const buildings = new Set<string>();
    const levels = new Set<string>();
    const tasks = new Set<string>();
    const trades = new Set<string>();
    
    // Single pass through inspections for all computations
    deferredInspections.forEach(inspection => {
      // Count statuses
      statusCounts.total++;
      if (statusCounts.hasOwnProperty(inspection.overall_status)) {
        statusCounts[inspection.overall_status as keyof typeof statusCounts]++;
      }
      
      // Collect unique values
      if (inspection.inspector_name) inspectors.add(inspection.inspector_name);
      if (inspection.task_area) tasks.add(inspection.task_area);
      if (inspection.trade) trades.add(inspection.trade);
      
      // Optimized location parsing - avoid multiple regex calls
      if (inspection.location_reference) {
        const location = inspection.location_reference.toLowerCase();
        const buildingMatch = location.match(/building\s*([a-z0-9]+)/);
        const levelMatch = location.match(/level\s*([a-z0-9]+)/);
        
        if (buildingMatch) buildings.add(`Building ${buildingMatch[1].toUpperCase()}`);
        if (levelMatch) levels.add(`Level ${levelMatch[1]}`);
      }
    });
    
    return {
      statusCounts,
      uniqueInspectors: Array.from(inspectors).sort(),
      uniqueBuildings: Array.from(buildings).sort(),
      uniqueLevels: Array.from(levels).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        return aNum - bNum;
      }),
      uniqueTasks: Array.from(tasks).sort(),
      uniqueTrades: Array.from(trades).sort()
    };
  }, [deferredInspections]);

  const { statusCounts, uniqueInspectors, uniqueBuildings, uniqueLevels, uniqueTasks, uniqueTrades } = computedData;

  // PERFORMANCE OPTIMIZATION: Deferred filtering with optimized search
  const deferredSearchTerm = React.useDeferredValue(searchTerm);
  
  const filteredInspections = useMemo(() => {
    if (!deferredInspections.length) return [];
    
    // Pre-compile search terms for better performance
    const searchLower = deferredSearchTerm.toLowerCase();
    const hasSearch = searchLower.length > 0;
    
    // Pre-calculate date boundaries if needed
    let dateStart: Date | null = null;
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      switch (dateRangeFilter) {
        case 'today':
          dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
      }
    }
    
    return deferredInspections.filter(inspection => {
      // OPTIMIZATION: Most restrictive filters first for early exit
      
      // Quick exact matches first (fastest)
      if (statusFilter !== 'all' && inspection.overall_status !== statusFilter) return false;
      if (inspectionTypeFilter !== 'all' && inspection.inspection_type !== inspectionTypeFilter) return false;
      if (templateTypeFilter !== 'all' && inspection.template_type !== templateTypeFilter) return false;
      if (inspectorFilter !== 'all' && inspection.inspector_name !== inspectorFilter) return false;
      if (taskFilter !== 'all' && inspection.task_area !== taskFilter) return false;
      if (tradeFilter !== 'all' && inspection.trade !== tradeFilter) return false;

      // Optimized text search (avoid multiple toLowerCase calls)
      if (hasSearch) {
        const fields = [
          inspection.task_area,
          inspection.inspection_number,
          inspection.inspector_name,
          inspection.location_reference,
          inspection.project_name
        ];
        
        if (!fields.some(field => field && field.toLowerCase().includes(searchLower))) {
          return false;
        }
      }

      // Optimized location filters (avoid regex if possible)
      if (buildingFilter !== 'all' || levelFilter !== 'all') {
        const location = inspection.location_reference?.toLowerCase() || '';
        
        if (buildingFilter !== 'all') {
          const targetBuilding = buildingFilter.toLowerCase();
          if (!location.includes(targetBuilding.replace('building ', ''))) return false;
        }
        
        if (levelFilter !== 'all') {
          const targetLevel = levelFilter.toLowerCase();
          if (!location.includes(targetLevel.replace('level ', ''))) return false;
        }
      }

      // Date filter (most expensive, do last)
      if (dateStart && inspection.inspection_date) {
        const inspectionDate = new Date(inspection.inspection_date);
        if (dateRangeFilter === 'today') {
          if (inspectionDate.toDateString() !== dateStart.toDateString()) return false;
        } else {
          if (inspectionDate < dateStart) return false;
        }
      }

      return true;
    });
  }, [deferredInspections, deferredSearchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, inspectorFilter, dateRangeFilter, buildingFilter, levelFilter, taskFilter, tradeFilter]);

  // Memoized event handlers with stable references
  const handleSelectItem = useCallback((inspectionId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(inspectionId);
      } else {
        newSelection.delete(inspectionId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredInspections.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
  }, [filteredInspections]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nYou are about to permanently delete ${selectedItems.size} inspection record(s). All associated data including:\n• Inspection details\n• Checklist items\n• Attachments\n• Audit history\n\nWill be permanently removed from the system.\n\nAre you sure you want to continue?`;
    
    if (window.confirm(confirmMessage)) {
      let successCount = 0;
      for (const id of selectedItems) {
        const success = await deleteInspection(id);
        if (success) successCount++;
      }
      
      toast({
        title: successCount === selectedItems.size ? "Records Deleted" : "Partial Deletion",
        description: `${successCount}/${selectedItems.size} inspection records permanently deleted`,
        variant: successCount === selectedItems.size ? "default" : "destructive"
      });
      
      setSelectedItems(new Set());
    }
  }, [selectedItems, deleteInspection, toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setInspectionTypeFilter('all');
    setTemplateTypeFilter('all');
    setInspectorFilter('all');
    setDateRangeFilter('all');
    setBuildingFilter('all');
    setLevelFilter('all');
    setTaskFilter('all');
    setTradeFilter('all');
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'pending-reinspection': return '🔄';
      case 'incomplete-in-progress': return '⏳';
      case 'incomplete-draft': return '📝';
      default: return '❓';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'pending-reinspection': return 'bg-orange-100 text-orange-800';
      case 'incomplete-in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'incomplete-draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleViewInspection = useCallback((inspection: any) => {
    setSelectedInspection(inspection);
  }, []);

  const handleEditInspection = useCallback((inspection: any) => {
    // Check permissions first
    if (!qaPermissions.canEditInspections) {
      toast({
        title: "Permission Denied",
        description: qaPermissions.denialReason,
        variant: "destructive"
      });
      return;
    }
    
    // Open modal in edit mode - will auto-open details tab
    setSelectedInspection({ ...inspection, _openInEditMode: true });
  }, [qaPermissions, toast]);

  const handleDeleteInspection = useCallback(async (inspectionId: string) => {
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nYou are about to permanently delete this inspection record. All associated data including:\n• Inspection details\n• Checklist items\n• Attachments\n• Audit history\n\nWill be permanently removed from the system.\n\nAre you sure you want to continue?`;
    
    if (window.confirm(confirmMessage)) {
      const success = await deleteInspection(inspectionId);
      if (success) {
        toast({
          title: "Record Deleted",
          description: "Inspection record permanently deleted",
          variant: "default"
        });
      }
    }
  }, [deleteInspection, toast]);

  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== 'all' || inspectionTypeFilter !== 'all' || 
    templateTypeFilter !== 'all' || inspectorFilter !== 'all' || dateRangeFilter !== 'all' ||
    buildingFilter !== 'all' || levelFilter !== 'all' || taskFilter !== 'all' || tradeFilter !== 'all';

  return {
    // Data
    inspections,
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
    editingInspection,
    setEditingInspection,
    selectedItems,
    setSelectedItems,
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
  };
};
