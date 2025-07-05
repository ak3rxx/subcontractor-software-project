import { useState, useMemo, useCallback } from 'react';
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

  // Memoized computations for performance
  const statusCounts = useMemo(() => {
    return inspections.reduce((acc, inspection) => {
      acc[inspection.overall_status] = (acc[inspection.overall_status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [inspections]);

  const uniqueInspectors = useMemo(() => {
    const inspectors = new Set(inspections.map(i => i.inspector_name).filter(Boolean));
    return Array.from(inspectors).sort();
  }, [inspections]);

  const uniqueBuildings = useMemo(() => {
    const buildings = new Set(
      inspections.map(i => {
        const match = i.location_reference?.match(/building\s*(\d+|[a-z]+)/i);
        return match ? match[0] : null;
      }).filter(Boolean)
    );
    return Array.from(buildings).sort();
  }, [inspections]);

  const uniqueLevels = useMemo(() => {
    const levels = new Set(
      inspections.map(i => {
        const match = i.location_reference?.match(/level\s*(\d+|[a-z]+)/i);
        return match ? match[0] : null;
      }).filter(Boolean)
    );
    return Array.from(levels).sort();
  }, [inspections]);

  const uniqueTasks = useMemo(() => {
    const tasks = new Set(inspections.map(i => i.task_area).filter(Boolean));
    return Array.from(tasks).sort();
  }, [inspections]);

  const uniqueTrades = useMemo(() => {
    const trades = new Set(inspections.map(i => i.trade).filter(Boolean));
    return Array.from(trades).sort();
  }, [inspections]);

  // Optimized filter function with debouncing effect
  const filteredInspections = useMemo(() => {
    if (!inspections.length) return [];
    
    return inspections.filter(inspection => {
      // Text search with early return
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchMatch = [
          inspection.task_area,
          inspection.inspection_number,
          inspection.inspector_name,
          inspection.location_reference,
          inspection.project_name
        ].some(field => field?.toLowerCase().includes(searchLower));
        
        if (!searchMatch) return false;
      }

      // Quick status filters
      if (statusFilter !== 'all' && inspection.overall_status !== statusFilter) return false;
      if (inspectionTypeFilter !== 'all' && inspection.inspection_type !== inspectionTypeFilter) return false;
      if (templateTypeFilter !== 'all' && inspection.template_type !== templateTypeFilter) return false;
      if (inspectorFilter !== 'all' && inspection.inspector_name !== inspectorFilter) return false;
      if (taskFilter !== 'all' && inspection.task_area !== taskFilter) return false;
      if (tradeFilter !== 'all' && inspection.trade !== tradeFilter) return false;

      // Building filter
      if (buildingFilter !== 'all') {
        const buildingMatch = inspection.location_reference?.match(/building\s*(\d+|[a-z]+)/i);
        const extractedBuilding = buildingMatch ? buildingMatch[0] : null;
        if (extractedBuilding !== buildingFilter) return false;
      }

      // Level filter
      if (levelFilter !== 'all') {
        const levelMatch = inspection.location_reference?.match(/level\s*(\d+|[a-z]+)/i);
        const extractedLevel = levelMatch ? levelMatch[0] : null;
        if (extractedLevel !== levelFilter) return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'all' && inspection.inspection_date) {
        const inspectionDate = new Date(inspection.inspection_date);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            if (inspectionDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (inspectionDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (inspectionDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [inspections, searchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, inspectorFilter, dateRangeFilter, buildingFilter, levelFilter, taskFilter, tradeFilter]);

  // Optimized event handlers
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
    setSelectedItems(checked ? new Set(filteredInspections.map(i => i.id)) : new Set());
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

  // Stable utility functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'pending-reinspection': return '🔄';
      case 'incomplete-in-progress': return '⏳';
      default: return '❓';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'pending-reinspection': return 'bg-orange-100 text-orange-800';
      case 'incomplete-in-progress': return 'bg-yellow-100 text-yellow-800';
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
