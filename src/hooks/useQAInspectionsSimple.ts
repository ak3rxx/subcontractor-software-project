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

    const maxRetries = 2; // Reduced retries for faster timeout
    let attempt = 0;
    const startTime = Date.now();
    const timeoutMs = 30000; // 30 second timeout

    while (attempt < maxRetries) {
      try {
        // Check for timeout
        if (Date.now() - startTime > timeoutMs) {
          console.error('QA: Creation timeout exceeded');
          toast({
            title: "Timeout",
            description: "Form submission is taking too long. Please try again or save as draft.",
            variant: "destructive"
          });
          return null;
        }

        attempt++;
        console.log(`QA: Creating inspection attempt ${attempt}/${maxRetries} (${Date.now() - startTime}ms elapsed)`);

        // Generate project-specific inspection number with timeout
        const numberPromise = supabase
          .rpc('generate_qa_inspection_number', { project_uuid: inspectionData.project_id });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Number generation timeout')), 10000)
        );

        const { data: numberData, error: numberError } = await Promise.race([
          numberPromise,
          timeoutPromise
        ]) as any;

        if (numberError) {
          console.error('QA: Number generation error:', numberError);
          if (attempt === maxRetries) {
            toast({
              title: "Error",
              description: "Failed to generate inspection number. Please try again.",
              variant: "destructive"
            });
            return null;
          }
          // Shorter wait before retry
          await new Promise(resolve => setTimeout(resolve, 50 * attempt));
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

        // Insert inspection with timeout
        const insertPromise = supabase
          .from('qa_inspections')
          .insert(insertData)
          .select()
          .single();
        
        const insertTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Inspection insert timeout')), 15000)
        );

        const { data: inspectionResult, error: inspectionError } = await Promise.race([
          insertPromise,
          insertTimeoutPromise
        ]) as any;

        if (inspectionError) {
          console.error('QA: Inspection creation error:', inspectionError);
          
          // Check if it's a unique constraint violation (duplicate inspection number)
          if (inspectionError.code === '23505' && 
              inspectionError.message?.includes('unique_inspection_number_per_project')) {
            console.log('QA: Duplicate inspection number detected, retrying...');
            if (attempt < maxRetries) {
              // Shorter wait before retry
              await new Promise(resolve => setTimeout(resolve, 100 * attempt));
              continue;
            }
          }
          
          // For other errors or max retries reached
          toast({
            title: "Error",
            description: attempt === maxRetries ? 
              "Failed to create inspection. Please try saving as draft instead." : 
              "Failed to create inspection",
            variant: "destructive"
          });
          return null;
        }

        // Success - break out of retry loop
        console.log(`QA: Inspection created successfully with number: ${numberData}`);

        // Insert checklist items with timeout
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

          const checklistPromise = supabase
            .from('qa_checklist_items')
            .insert(checklistInserts);
          
          const checklistTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Checklist insert timeout')), 10000)
          );

          await Promise.race([checklistPromise, checklistTimeoutPromise]);
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
        
        // Check if timeout was reached
        if (Date.now() - startTime > timeoutMs) {
          toast({
            title: "Timeout",
            description: "Form submission timed out. Please try saving as a draft instead.",
            variant: "destructive"
          });
          return null;
        }
        
        // If this was the last attempt, show error and return
        if (attempt === maxRetries) {
          const isTimeoutError = error instanceof Error && error.message.includes('timeout');
          toast({
            title: isTimeoutError ? "Timeout" : "Error",
            description: isTimeoutError ? 
              "Operation timed out. Try saving as draft instead." : 
              "Failed to create inspection. Please try again.",
            variant: "destructive"
          });
          return null;
        }
        
        // Shorter wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
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

  // Fixed subscription management - CRITICAL BUG FIX
  useEffect(() => {
    console.log('QA: Effect triggered for project:', projectId, 'user:', user?.id);
    
    // Always fetch initial data first
    fetchInspections(projectId, user);

    // Don't create subscription if no user or project
    if (!user || !projectId) {
      console.log('QA: Skipping subscription - no user or project');
      return;
    }

    // Check if we already have a subscription for this project
    if (subscriptionRef.current && subscribedProjectRef.current === projectId) {
      console.log('QA: Subscription already exists for project:', projectId);
      return;
    }

    // Clean up any existing subscription BEFORE creating new one
    if (subscriptionRef.current) {
      console.log('QA: Cleaning up existing subscription for project:', subscribedProjectRef.current);
      subscriptionRef.current.unsubscribe();
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      subscribedProjectRef.current = undefined;
    }

    // Create new subscription with unique channel name
    const channelName = `qa_inspections_${projectId}_${Date.now()}`;
    console.log('QA: Creating new subscription:', channelName);
    
    // Set the project reference BEFORE creating subscription
    subscribedProjectRef.current = projectId;
    
    // Debounce reference for real-time updates
    let debounceTimer: NodeJS.Timeout | null = null;
    
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
          console.log('QA: Real-time change detected:', payload.eventType, 'for project:', projectId);
          
          // Clear existing timer
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          // Debounce the fetch to prevent excessive calls
          debounceTimer = setTimeout(() => {
            console.log('QA: Executing debounced fetch for project:', projectId);
            fetchInspections(projectId, user);
            debounceTimer = null;
          }, 200); // Slightly increased debounce for stability
        }
      )
      .subscribe((status) => {
        console.log('QA: Subscription status:', status, 'for project:', projectId);
      });

    subscriptionRef.current = channel;

    // Cleanup function
    return () => {
      console.log('QA: Component cleanup for project:', projectId);
      
      // Clear any pending debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      
      // Only cleanup if this is our subscription
      if (subscriptionRef.current && subscribedProjectRef.current === projectId) {
        console.log('QA: Unsubscribing from project:', projectId);
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