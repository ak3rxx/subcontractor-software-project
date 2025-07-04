
import React, { useState } from 'react';
import { useVariationsRefactored } from '@/hooks/variations/useVariationsRefactored';
import { useVariationOptimizations } from '@/hooks/variations/useVariationOptimizations';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';

interface VariationManagerLogicProps {
  projectId: string;
  children: (props: {
    // Data
    variations: Variation[];
    filteredVariations: Variation[];
    loading: boolean;
    error: string | null;
    summary: any;
    variationMap: Record<string, Variation>;
    statusCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    
    // Actions
    createVariation: (data: any) => Promise<Variation | null>;
    updateVariation: (id: string, updates: any) => Promise<Variation | null>;
    sendVariationEmail: (variationId: string) => Promise<boolean>;
    refreshVariations: () => Promise<void>;
    
    // Filters
    filters: any;
    updateFilter: (key: any, value: any) => void;
    setFilters: any;
    
    // Permissions
    canCreateVariations: boolean;
    canEditVariations: boolean;
    canSendEmails: boolean;
    canViewVariations: boolean;
    
    // State
    showForm: boolean;
    setShowForm: (show: boolean) => void;
    selectedVariation: Variation | null;
    setSelectedVariation: (variation: Variation | null) => void;
    showDetailsModal: boolean;
    setShowDetailsModal: (show: boolean) => void;
    editingVariation: Variation | null;
    setEditingVariation: (variation: Variation | null) => void;
    formKey: number;
    setFormKey: (key: number) => void;
    activeTab: 'list' | 'analytics';
    setActiveTab: (tab: 'list' | 'analytics') => void;
  }) => React.ReactNode;
}

export const VariationManagerLogic: React.FC<VariationManagerLogicProps> = ({
  projectId,
  children
}) => {
  // Use refactored hooks
  const {
    variations,
    filteredVariations,
    loading,
    error,
    summary,
    createVariation,
    updateVariation,
    sendVariationEmail,
    refetch: refreshVariations,
    filters,
    updateFilter,
    setFilters
  } = useVariationsRefactored(projectId);

  // Performance optimizations
  const {
    variationMap,
    statusCounts,
    priorityCounts
  } = useVariationOptimizations(variations);

  const { toast } = useToast();
  const { user, isDeveloper, hasRole, canAccess } = useAuth();
  
  // Comprehensive permission checks using the proper auth system
  const canEdit = () => user && (isDeveloper() || hasRole('org_admin') || hasRole('project_manager'));
  const canAdmin = () => user && (isDeveloper() || hasRole('org_admin'));
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  // Enhanced permission checks using comprehensive auth
  const canCreateVariations = isDeveloper() || canEdit();
  const canEditVariations = isDeveloper() || canEdit() || canAdmin();
  const canSendEmails = isDeveloper() || canAdmin();
  const canViewVariations = isDeveloper() || canAccess('variations');

  return (
    <>
      {children({
        // Data
        variations,
        filteredVariations,
        loading,
        error,
        summary,
        variationMap,
        statusCounts,
        priorityCounts,
        
        // Actions
        createVariation,
        updateVariation,
        sendVariationEmail,
        refreshVariations,
        
        // Filters
        filters,
        updateFilter,
        setFilters,
        
        // Permissions
        canCreateVariations,
        canEditVariations,
        canSendEmails,
        canViewVariations,
        
        // State
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
      })}
    </>
  );
};
