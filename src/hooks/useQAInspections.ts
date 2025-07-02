
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type QAInspectionRow = Database['public']['Tables']['qa_inspections']['Row'];
type QAInspectionInsert = Database['public']['Tables']['qa_inspections']['Insert'];
type QAChecklistItemRow = Database['public']['Tables']['qa_checklist_items']['Row'];
type QAChecklistItemInsert = Database['public']['Tables']['qa_checklist_items']['Insert'];

export interface QAInspection {
  id: string;
  project_id: string;
  inspection_number: string;
  project_name: string;
  task_area: string;
  location_reference: string;
  inspection_type: 'post-installation' | 'final' | 'progress';
  template_type: 'doors-jambs-hardware' | 'skirting';
  is_fire_door: boolean;
  inspector_name: string;
  inspection_date: string;
  digital_signature: string;
  overall_status: 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QAChecklistItem {
  id: string;
  inspection_id: string;
  item_id: string;
  description: string;
  requirements: string;
  status: 'pass' | 'fail' | 'na' | '';
  comments: string | null;
  evidence_files: string[] | null;
  created_at: string;
}

const transformInspectionData = (inspection: QAInspectionRow): QAInspection => {
  return {
    id: inspection.id,
    project_id: inspection.project_id,
    inspection_number: inspection.inspection_number,
    project_name: inspection.project_name,
    task_area: inspection.task_area,
    location_reference: inspection.location_reference,
    inspection_type: inspection.inspection_type as QAInspection['inspection_type'],
    template_type: inspection.template_type as QAInspection['template_type'],
    is_fire_door: inspection.is_fire_door,
    inspector_name: inspection.inspector_name,
    inspection_date: inspection.inspection_date,
    digital_signature: inspection.digital_signature,
    overall_status: inspection.overall_status as QAInspection['overall_status'],
    created_by: inspection.created_by,
    created_at: inspection.created_at || '',
    updated_at: inspection.updated_at || ''
  };
};

const transformChecklistItemData = (item: QAChecklistItemRow): QAChecklistItem => {
  return {
    id: item.id,
    inspection_id: item.inspection_id,
    item_id: item.item_id,
    description: item.description,
    requirements: item.requirements,
    status: (item.status as QAChecklistItem['status']) || '',
    comments: item.comments,
    evidence_files: item.evidence_files,
    created_at: item.created_at || ''
  };
};

export const useQAInspections = (projectId?: string) => {
  const [inspections, setInspections] = useState<QAInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInspections = async () => {
    if (!user) {
      console.log('No user found, skipping QA inspections fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching QA inspections for user:', user.id, 'project:', projectId);
      
      let query = supabase
        .from('qa_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching QA inspections:', error);
        
        // Handle specific error types
        if (error.message.includes('infinite recursion')) {
          console.error('Database policy recursion detected');
          toast({
            title: "Database Error",
            description: "Please refresh the page and try again. If the issue persists, contact support.",
            variant: "destructive"
          });
        } else if (error.message.includes('permission')) {
          console.log('Permission denied for QA inspections - user may not have access');
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch QA inspections",
            variant: "destructive"
          });
        }
        
        setInspections([]);
        return;
      }

      console.log('Successfully fetched QA inspections:', data?.length || 0);
      const transformedInspections = (data || []).map(transformInspectionData);
      setInspections(transformedInspections);
    } catch (error) {
      console.error('Unexpected error fetching QA inspections:', error);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (
    inspectionData: Omit<QAInspection, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'inspection_number'>,
    checklistItems: Array<{
      item_id: string;
      description: string;
      requirements: string;
      status: string;
      comments: string;
      evidence_files: string[];
    }>
  ) => {
    if (!user) {
      console.error('No user found for creating inspection');
      return null;
    }

    try {
      console.log('Creating QA inspection for user:', user.id);
      
      // Generate inspection number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_inspection_number');

      if (numberError) {
        console.error('Error generating inspection number:', numberError);
        toast({
          title: "Error",
          description: "Failed to generate inspection number",
          variant: "destructive"
        });
        return null;
      }

      // Get user's organization - with better error handling
      const { data: orgData, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle to avoid errors when no data

      if (orgError) {
        console.error('Error getting user organization:', orgError);
        toast({
          title: "Error",
          description: "Could not determine user organization",
          variant: "destructive"
        });
        return null;
      }

      // If no organization found, we can still create the inspection
      const organizationId = orgData?.organization_id || null;
      console.log('User organization ID:', organizationId);

      const insertData: QAInspectionInsert = {
        ...inspectionData,
        inspection_number: numberData,
        created_by: user.id,
        organization_id: organizationId
      };

      console.log('Creating QA inspection with data:', insertData);

      const { data: inspectionResult, error: inspectionError } = await supabase
        .from('qa_inspections')
        .insert(insertData)
        .select()
        .single();

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError);
        
        if (inspectionError.message.includes('policy')) {
          toast({
            title: "Permission Error",
            description: "You don't have permission to create inspections. Please check your organization membership.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to create inspection: ${inspectionError.message}`,
            variant: "destructive"
          });
        }
        return null;
      }

      console.log('Successfully created inspection:', inspectionResult.id);

      // Insert checklist items if provided
      if (checklistItems.length > 0) {
        const checklistInserts: QAChecklistItemInsert[] = checklistItems.map(item => ({
          ...item,
          inspection_id: inspectionResult.id,
          evidence_files: item.evidence_files.length > 0 ? item.evidence_files : null
        }));

        const { error: checklistError } = await supabase
          .from('qa_checklist_items')
          .insert(checklistInserts);

        if (checklistError) {
          console.error('Error creating checklist items:', checklistError);
          toast({
            title: "Warning",
            description: "Inspection created but some checklist items failed to save",
            variant: "destructive"
          });
        } else {
          console.log('Successfully created checklist items:', checklistItems.length);
        }
      }

      toast({
        title: "Success",
        description: "QA inspection created successfully"
      });

      const newInspection = transformInspectionData(inspectionResult);
      setInspections(prev => [newInspection, ...prev]);
      return newInspection;
    } catch (error) {
      console.error('Unexpected error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateInspection = async (
    inspectionId: string,
    inspectionData: Partial<QAInspection>,
    checklistItems?: Array<{
      item_id: string;
      description: string;
      requirements: string;
      status: string;
      comments: string;
      evidence_files: string[];
    }>
  ) => {
    if (!user) return null;

    try {
      // Update inspection
      const { data: inspectionResult, error: inspectionError } = await supabase
        .from('qa_inspections')
        .update({
          ...inspectionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)
        .select()
        .single();

      if (inspectionError) {
        console.error('Error updating inspection:', inspectionError);
        toast({
          title: "Error",
          description: "Failed to update inspection",
          variant: "destructive"
        });
        return null;
      }

      // Update checklist items if provided - delete and recreate them
      if (checklistItems && checklistItems.length > 0) {
        // First delete existing checklist items for this inspection
        const { error: deleteError } = await supabase
          .from('qa_checklist_items')
          .delete()
          .eq('inspection_id', inspectionId);

        if (deleteError) {
          console.error('Error deleting existing checklist items:', deleteError);
        } else {
          // Insert new checklist items
          const checklistInserts: QAChecklistItemInsert[] = checklistItems.map(item => ({
            ...item,
            inspection_id: inspectionId,
            evidence_files: item.evidence_files.length > 0 ? item.evidence_files : null
          }));

          const { error: insertError } = await supabase
            .from('qa_checklist_items')
            .insert(checklistInserts);

          if (insertError) {
            console.error('Error inserting updated checklist items:', insertError);
          }
        }
      }

      toast({
        title: "Success",
        description: "Inspection updated successfully"
      });

      const updatedInspection = transformInspectionData(inspectionResult);
      setInspections(prev => prev.map(inspection => 
        inspection.id === inspectionId ? updatedInspection : inspection
      ));
      
      return updatedInspection;
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateChecklistItem = async (itemId: string, updates: Partial<QAChecklistItem>) => {
    if (!user) return null;

    try {
      // Ensure evidence_files is properly typed
      const updateData = {
        ...updates,
        evidence_files: updates.evidence_files ? updates.evidence_files as string[] : null,
        created_at: new Date().toISOString() // Update timestamp when item is modified
      };

      const { data, error } = await supabase
        .from('qa_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating checklist item:', error);
        return null;
      }

      return transformChecklistItemData(data);
    } catch (error) {
      console.error('Error updating checklist item:', error);
      return null;
    }
  };

  const getChecklistItems = async (inspectionId: string): Promise<QAChecklistItem[]> => {
    try {
      const { data, error } = await supabase
        .from('qa_checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('item_id');

      if (error) {
        console.error('Error fetching checklist items:', error);
        return [];
      }

      return (data || []).map(transformChecklistItemData);
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const getInspectionById = async (inspectionId: string): Promise<QAInspection | null> => {
    try {
      const { data, error } = await supabase
        .from('qa_inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) {
        console.error('Error fetching inspection:', error);
        return null;
      }

      return transformInspectionData(data);
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const deleteInspection = async (inspectionId: string) => {
    if (!user) return false;

    try {
      // First delete related checklist items
      const { error: checklistError } = await supabase
        .from('qa_checklist_items')
        .delete()
        .eq('inspection_id', inspectionId);

      if (checklistError) {
        console.error('Error deleting checklist items:', checklistError);
        toast({
          title: "Error",
          description: "Failed to delete inspection checklist items",
          variant: "destructive"
        });
        return false;
      }

      // Then delete the inspection
      const { error: inspectionError } = await supabase
        .from('qa_inspections')
        .delete()
        .eq('id', inspectionId);

      if (inspectionError) {
        console.error('Error deleting inspection:', inspectionError);
        toast({
          title: "Error",
          description: "Failed to delete inspection",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Inspection deleted successfully"
      });

      setInspections(prev => prev.filter(inspection => inspection.id !== inspectionId));
      return true;
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive"
      });
      return false;
    }
  };

  const bulkDeleteInspections = async (inspectionIds: string[]) => {
    if (!user) return false;

    try {
      // Delete related checklist items for all inspections
      const { error: checklistError } = await supabase
        .from('qa_checklist_items')
        .delete()
        .in('inspection_id', inspectionIds);

      if (checklistError) {
        console.error('Error deleting checklist items:', checklistError);
        toast({
          title: "Error",
          description: "Failed to delete inspection checklist items",
          variant: "destructive"
        });
        return false;
      }

      // Delete the inspections
      const { error: inspectionError } = await supabase
        .from('qa_inspections')
        .delete()
        .in('id', inspectionIds);

      if (inspectionError) {
        console.error('Error deleting inspections:', inspectionError);
        toast({
          title: "Error",
          description: "Failed to delete inspections",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Successfully deleted ${inspectionIds.length} inspection(s)`
      });

      setInspections(prev => prev.filter(inspection => !inspectionIds.includes(inspection.id)));
      return true;
    } catch (error) {
      console.error('Error bulk deleting inspections:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspections",
        variant: "destructive"
      });
      return false;
    }
  };

  const bulkUpdateInspections = async (inspectionIds: string[], updates: Partial<QAInspection>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('qa_inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', inspectionIds);

      if (error) {
        console.error('Error bulk updating inspections:', error);
        toast({
          title: "Error",
          description: "Failed to update inspections",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Successfully updated ${inspectionIds.length} inspection(s)`
      });

      // Refresh the inspections list
      await fetchInspections();
      return true;
    } catch (error) {
      console.error('Error bulk updating inspections:', error);
      toast({
        title: "Error",
        description: "Failed to update inspections",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [user, projectId]);

  return {
    inspections,
    loading,
    createInspection,
    updateInspection,
    updateChecklistItem,
    deleteInspection,
    bulkDeleteInspections,
    bulkUpdateInspections,
    getChecklistItems,
    getInspectionById,
    refetch: fetchInspections
  };
};
