import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface QAInspection {
  id: string;
  project_id: string;
  inspection_number: string;
  project_name: string;
  task_area: string;
  location_reference: string;
  inspection_type: 'pre-installation' | 'final' | 'progress';
  template_type: 'doors-jambs-hardware' | 'skirting';
  trade: string;
  is_fire_door: boolean;
  inspector_name: string;
  inspection_date: string;
  digital_signature: string;
  overall_status: 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress' | 'incomplete-draft';
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
  
  // Use refs to prevent subscription loops
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const subscribedProjectRef = useRef<string | undefined>(undefined);

  // Stable fetch function with debouncing
  const fetchInspections = useCallback(async (currentProjectId?: string, currentUser?: any) => {
    const targetProjectId = currentProjectId || projectId;
    const targetUser = currentUser || user;
    
    if (!targetUser) {
      setLoading(false);
      return;
    }

    console.log('QA: Fetching inspections for project:', targetProjectId);
    try {
      let query = supabase
        .from('qa_inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetProjectId) {
        query = query.eq('project_id', targetProjectId);
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
      console.log('QA: Fetched', transformedData.length, 'inspections');
    } catch (error) {
      console.error('Unexpected error:', error);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable function

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

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`QA: Creating inspection attempt ${attempt}/${maxRetries}`);

        // Generate project-specific inspection number
        const { data: numberData, error: numberError } = await supabase
          .rpc('generate_qa_inspection_number', { project_uuid: inspectionData.project_id });

        if (numberError) {
          console.error('QA: Number generation error:', numberError);
          if (attempt === maxRetries) {
            toast({
              title: "Error",
              description: "Failed to generate inspection number after multiple attempts",
              variant: "destructive"
            });
            return null;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }

        console.log(`QA: Generated inspection number: ${numberData}`);

        // Get user's organization
        const { data: orgData } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        const insertData = {
          ...inspectionData,
          inspection_number: numberData,
          created_by: user.id,
          organization_id: orgData?.organization_id || null
        };

        const { data: inspectionResult, error: inspectionError } = await supabase
          .from('qa_inspections')
          .insert(insertData)
          .select()
          .single();

        if (inspectionError) {
          console.error('QA: Inspection creation error:', inspectionError);
          
          // Check if it's a unique constraint violation (duplicate inspection number)
          if (inspectionError.code === '23505' && 
              inspectionError.message?.includes('unique_inspection_number_per_project')) {
            console.log('QA: Duplicate inspection number detected, retrying...');
            if (attempt < maxRetries) {
              // Wait before retry with exponential backoff
              await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt - 1)));
              continue;
            }
          }
          
          // For other errors or max retries reached
          toast({
            title: "Error",
            description: attempt === maxRetries ? 
              "Failed to create inspection after multiple attempts" : 
              "Failed to create inspection",
            variant: "destructive"
          });
          return null;
        }

        // Success - break out of retry loop
        console.log(`QA: Inspection created successfully with number: ${numberData}`);

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

        // Notify other components about the new inspection
        window.dispatchEvent(new CustomEvent('qa-inspection-created', { 
          detail: { inspectionId: inspectionResult.id, projectId } 
        }));

        await fetchInspections(projectId, user);
        return inspectionResult;

      } catch (error) {
        console.error(`QA: Error on attempt ${attempt}:`, error);
        
        // If this was the last attempt, show error and return
        if (attempt === maxRetries) {
          toast({
            title: "Error",
            description: "Failed to create inspection after multiple attempts",
            variant: "destructive"
          });
          return null;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt - 1)));
      }
    }

    // This should never be reached, but just in case
    return null;
  }, [user, toast, fetchInspections, projectId]);

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

      // Notify other components about the updated inspection
      window.dispatchEvent(new CustomEvent('qa-inspection-updated', { 
        detail: { inspectionId, projectId } 
      }));

      await fetchInspections(projectId, user);
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
  }, [user, toast, fetchInspections, projectId]);

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

      // Notify other components about the deleted inspection
      window.dispatchEvent(new CustomEvent('qa-inspection-deleted', { 
        detail: { inspectionId, projectId } 
      }));

      await fetchInspections(projectId, user);
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
  }, [user, toast, fetchInspections, projectId]);

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

  // Fixed subscription management with deduplication
  useEffect(() => {
    console.log('QA: Effect triggered for project:', projectId, 'user:', user?.id);
    
    // Always fetch initial data
    fetchInspections(projectId, user);

    // Clean up existing subscription if project changed
    if (subscriptionRef.current && subscribedProjectRef.current !== projectId) {
      console.log('QA: Cleaning up old subscription for project:', subscribedProjectRef.current);
      subscriptionRef.current.unsubscribe();
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      subscribedProjectRef.current = undefined;
    }

    // Only subscribe if we have a valid user and project ID and no existing subscription for this project
    if (!user || !projectId || subscribedProjectRef.current === projectId) {
      return;
    }

    // Create new subscription
    const channelName = `qa_inspections_${projectId}_${Date.now()}`;
    console.log('QA: Creating new subscription:', channelName);
    
    subscribedProjectRef.current = projectId;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'qa_inspections',
          filter: `project_id=eq.${projectId}`
        }, 
        (payload) => {
          console.log('QA: Real-time change detected:', payload.eventType);
          // Simple debounced refetch
          setTimeout(() => fetchInspections(projectId, user), 500);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      console.log('QA: Component cleanup for project:', projectId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        subscribedProjectRef.current = undefined;
      }
    };
  }, [projectId, user?.id, fetchInspections]);

  // Stable refetch function
  const refetch = useCallback(() => {
    fetchInspections(projectId, user);
  }, [fetchInspections, projectId, user]);

  return {
    inspections,
    loading,
    createInspection,
    updateInspection,
    deleteInspection,
    getChecklistItems,
    getInspectionById,
    refetch
  };
};