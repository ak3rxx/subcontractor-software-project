import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const useQAInspectionsSimple = (projectId?: string) => {
  const [inspections, setInspections] = useState<QAInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInspections = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
        toast({
          title: "Error",
          description: "Failed to fetch QA inspections",
          variant: "destructive"
        });
        setInspections([]);
        return;
      }

      // Transform the raw data to match our interface types
      const transformedData = (data || []).map(item => ({
        ...item,
        inspection_type: item.inspection_type as QAInspection['inspection_type'],
        template_type: item.template_type as QAInspection['template_type'],
        overall_status: item.overall_status as QAInspection['overall_status']
      }));
      setInspections(transformedData);
    } catch (error) {
      console.error('Unexpected error:', error);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, toast]);

  const createInspection = useCallback(async (
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
    if (!user) return null;

    try {
      // Generate inspection number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_inspection_number');

      if (numberError) {
        toast({
          title: "Error",
          description: "Failed to generate inspection number",
          variant: "destructive"
        });
        return null;
      }

      const insertData = {
        ...inspectionData,
        inspection_number: numberData,
        created_by: user.id,
        organization_id: null // Simplified for now
      };

      const { data: inspectionResult, error: inspectionError } = await supabase
        .from('qa_inspections')
        .insert(insertData)
        .select()
        .single();

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError);
        toast({
          title: "Error",
          description: "Failed to create inspection",
          variant: "destructive"
        });
        return null;
      }

      // Insert checklist items
      if (checklistItems.length > 0) {
        const checklistInserts = checklistItems.map(item => ({
          inspection_id: inspectionResult.id,
          item_id: item.item_id,
          description: item.description,
          requirements: item.requirements,
          status: item.status || '',
          comments: item.comments || null,
          evidence_files: item.evidence_files.length > 0 ? item.evidence_files : null
        }));

        await supabase
          .from('qa_checklist_items')
          .insert(checklistInserts);
      }

      toast({
        title: "Success",
        description: "QA inspection created successfully"
      });

      await fetchInspections();
      return inspectionResult;
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, fetchInspections]);

  const updateInspection = useCallback(async (
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
        toast({
          title: "Error",
          description: "Failed to update inspection",
          variant: "destructive"
        });
        return null;
      }

      // Update checklist items if provided
      if (checklistItems && checklistItems.length > 0) {
        // Delete existing items
        await supabase
          .from('qa_checklist_items')
          .delete()
          .eq('inspection_id', inspectionId);

        // Insert new items
        const checklistInserts = checklistItems.map(item => ({
          inspection_id: inspectionId,
          item_id: item.item_id,
          description: item.description,
          requirements: item.requirements,
          status: item.status || '',
          comments: item.comments || null,
          evidence_files: item.evidence_files.length > 0 ? item.evidence_files : null
        }));

        await supabase
          .from('qa_checklist_items')
          .insert(checklistInserts);
      }

      toast({
        title: "Success",
        description: "Inspection updated successfully"
      });

      await fetchInspections();
      return inspectionResult;
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast, fetchInspections]);

  const deleteInspection = useCallback(async (inspectionId: string) => {
    if (!user) return false;

    try {
      // Delete checklist items first
      await supabase
        .from('qa_checklist_items')
        .delete()
        .eq('inspection_id', inspectionId);

      // Delete inspection
      const { error } = await supabase
        .from('qa_inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) {
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

      await fetchInspections();
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
  }, [user, toast, fetchInspections]);

  const getChecklistItems = useCallback(async (inspectionId: string): Promise<QAChecklistItem[]> => {
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

      // Transform the raw data to match our interface types
      const transformedData = (data || []).map(item => ({
        ...item,
        status: item.status as QAChecklistItem['status']
      }));
      return transformedData;
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }, []);

  const getInspectionById = useCallback(async (inspectionId: string): Promise<QAInspection | null> => {
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

      // Transform the raw data to match our interface types
      return {
        ...data,
        inspection_type: data.inspection_type as QAInspection['inspection_type'],
        template_type: data.template_type as QAInspection['template_type'],
        overall_status: data.overall_status as QAInspection['overall_status']
      };
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  return {
    inspections,
    loading,
    createInspection,
    updateInspection,
    deleteInspection,
    getChecklistItems,
    getInspectionById,
    refetch: fetchInspections
  };
};