
import { useState, useEffect, useCallback } from 'react';
import { Variation, VariationFormData } from '@/types/variations';

export const useVariationModal = (variation: Variation | null) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');

  // Reset state when variation changes
  useEffect(() => {
    if (variation) {
      const initialData = {
        title: variation.title,
        description: variation.description || '',
        location: variation.location || '',
        cost_impact: variation.cost_impact,
        time_impact: variation.time_impact,
        category: variation.category || '',
        trade: variation.trade || '',
        priority: variation.priority,
        client_email: variation.client_email || '',
        justification: variation.justification || '',
        requires_nod: variation.requires_nod || false,
        requires_eot: variation.requires_eot || false,
        nod_days: variation.nod_days || 0,
        eot_days: variation.eot_days || 0,
        cost_breakdown: variation.cost_breakdown || [],
        gst_amount: variation.gst_amount || 0,
        total_amount: variation.total_amount || 0
      };
      
      setEditData(initialData);
      setOriginalData(initialData);
      setPendingChanges({});
    }
  }, [variation]);

  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
    setPendingChanges(prev => ({ ...prev, ...changes }));
  }, []);

  const resetEditState = useCallback(() => {
    setEditData(originalData);
    setPendingChanges({});
    setIsEditing(false);
    setShowConfirmDialog(false);
  }, [originalData]);

  return {
    isEditing,
    setIsEditing,
    showConfirmDialog,
    setShowConfirmDialog,
    editData,
    originalData,
    pendingChanges,
    activeTab,
    setActiveTab,
    handleDataChange,
    resetEditState
  };
};
