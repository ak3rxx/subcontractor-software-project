
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
  overall_status: 'pass' | 'fail' | 'pending-reinspection';
  created_by: string;
  organization_id: string;
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
    organization_id: inspection.organization_id,
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
    evidence_files: item.evidence_files
  };
};

export const useQAInspections = (projectId?: string) => {
  const [inspections, setInspections] = useState<QAInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInspections = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('qa_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by project if provided
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching QA inspections:', error);
        // Only show error toast for non-RLS errors
        if (!error.message.includes('policy') && !error.message.includes('permission')) {
          toast({
            title: "Error",
            description: "Failed to fetch QA inspections",
            variant: "destructive"
          });
        }
        setInspections([]);
        return;
      }

      const transformedInspections = (data || []).map(transformInspectionData);
      setInspections(transformedInspections);
    } catch (error) {
      console.error('Error:', error);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (
    inspectionData: Omit<QAInspection, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'organization_id' | 'inspection_number'>,
    checklistItems: Omit<QAChecklistItem, 'id' | 'inspection_id'>[]
  ) => {
    if (!user) return null;

    try {
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

      const insertData: QAInspectionInsert = {
        ...inspectionData,
        inspection_number: numberData,
        created_by: user.id,
        organization_id: '' // We'll handle organization later
      };

      console.log('Creating QA inspection with data:', insertData);

      const { data: inspectionResult, error: inspectionError } = await supabase
        .from('qa_inspections')
        .insert(insertData)
        .select()
        .single();

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError);
        toast({
          title: "Error",
          description: `Failed to create inspection: ${inspectionError.message}`,
          variant: "destructive"
        });
        return null;
      }

      // Insert checklist items
      if (checklistItems.length > 0) {
        const checklistInserts: QAChecklistItemInsert[] = checklistItems.map(item => ({
          ...item,
          inspection_id: inspectionResult.id
        }));

        const { error: checklistError } = await supabase
          .from('qa_checklist_items')
          .insert(checklistInserts);

        if (checklistError) {
          console.error('Error creating checklist items:', checklistError);
          // Don't fail the whole operation, just log the error
          toast({
            title: "Warning",
            description: "Inspection created but some checklist items failed to save",
            variant: "destructive"
          });
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
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive"
      });
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

  useEffect(() => {
    fetchInspections();
  }, [user, projectId]);

  return {
    inspections,
    loading,
    createInspection,
    getChecklistItems,
    refetch: fetchInspections
  };
};
