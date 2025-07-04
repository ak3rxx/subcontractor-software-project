
import React, { useState, useMemo } from 'react';
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
  
  // Memoized permission checks for performance
  const permissions = useMemo(() => {
    if (!user) return {
      canEdit: false,
      canAdmin: false,
      canCreateVariations: false,
      canEditVariations: false,
      canSendEmails: false,
      canViewVariations: false
    };
    
    const isDevMode = isDeveloper();
    const isOrgAdmin = hasRole('org_admin');
    const isPM = hasRole('project_manager');
    const canAccVariations = canAccess('variations');
    
    const canEdit = isDevMode || isOrgAdmin || isPM;
    const canAdmin = isDevMode || isOrgAdmin;
    
    return {
      canEdit,
      canAdmin,
      canCreateVariations: canEdit,
      canEditVariations: canEdit || canAdmin,
      canSendEmails: canAdmin,
      canViewVariations: isDevMode || canAccVariations
    };
  }, [user, isDeveloper, hasRole, canAccess]);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

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
        canCreateVariations: permissions.canCreateVariations,
        canEditVariations: permissions.canEditVariations,
        canSendEmails: permissions.canSendEmails,
        canViewVariations: permissions.canViewVariations,
        
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
