
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Variation, VariationStatus, VariationPriority, VariationCategory } from '@/types/variations';

export const useVariations = (projectId: string) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const transformDatabaseVariation = (item: any): Variation => ({
    id: item.id,
    project_id: item.project_id,
    variation_number: item.variation_number,
    title: item.title,
    description: item.description || '',
    location: item.location || '',
    requested_by: item.requested_by,
    request_date: item.request_date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    cost_impact: item.cost_impact || 0,
    time_impact: item.time_impact || 0,
    status: item.status as VariationStatus,
    category: (item.category as VariationCategory) || 'other',
    trade: item.trade,
    priority: (item.priority as VariationPriority) || 'medium',
    client_email: item.client_email || '',
    justification: item.justification || '',
    attachments: [],
    approved_by: item.approved_by,
    approval_date: item.approval_date,
    approval_comments: item.approval_comments || '',
    email_sent: item.email_sent || false,
    email_sent_date: item.email_sent_date,
    email_sent_by: item.email_sent_by,
    cost_breakdown: item.cost_breakdown || [],
    time_impact_details: item.time_impact_details || { requiresNoticeOfDelay: false, requiresExtensionOfTime: false },
    gst_amount: item.gst_amount || 0,
    total_amount: item.total_amount || 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
    requires_eot: item.requires_eot || false,
    requires_nod: item.requires_nod || false,
    eot_days: item.eot_days || 0,
    nod_days: item.nod_days || 0,
    linked_milestones: item.linked_milestones || [],
    linked_tasks: item.linked_tasks || [],
    linked_qa_items: item.linked_qa_items || [],
    originating_rfi_id: item.originating_rfi_id,
    updated_by: item.updated_by
  });

  const fetchVariations = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('variations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedVariations = (data || []).map(transformDatabaseVariation);
      setVariations(transformedVariations);
    } catch (error) {
      console.error('Error fetching variations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch variations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const createVariation = useCallback(async (variationData: any): Promise<Variation> => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project ID missing');
    }

    try {
      // Generate variation number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_variation_number', { project_uuid: projectId });

      if (numberError) throw numberError;

      const insertData = {
        project_id: projectId,
        variation_number: numberData,
        title: variationData.title,
        description: variationData.description,
        location: variationData.location,
        requested_by: user.id,
        cost_impact: parseFloat(variationData.costImpact?.toString() || '0'),
        time_impact: parseInt(variationData.timeImpact?.toString() || '0'),
        priority: variationData.priority || 'medium',
        status: 'draft',
        category: variationData.category,
        trade: variationData.trade,
        client_email: variationData.clientEmail,
        justification: variationData.justification,
        cost_breakdown: JSON.stringify(variationData.cost_breakdown || []),
        time_impact_details: JSON.stringify(variationData.time_impact_details || { requiresNoticeOfDelay: false, requiresExtensionOfTime: false }),
        gst_amount: variationData.gst_amount || 0,
        total_amount: variationData.total_amount || variationData.costImpact || 0,
        requires_eot: variationData.requires_eot || false,
        requires_nod: variationData.requires_nod || false,
        eot_days: variationData.eot_days || 0,
        nod_days: variationData.nod_days || 0,
        linked_milestones: JSON.stringify(variationData.linked_milestones || []),
        linked_tasks: JSON.stringify(variationData.linked_tasks || []),
        linked_qa_items: JSON.stringify(variationData.linked_qa_items || [])
      };

      const { data, error } = await supabase
        .from('variations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newVariation = transformDatabaseVariation(data);
      setVariations(prev => [newVariation, ...prev]);
      
      return newVariation;
    } catch (error) {
      console.error('Error creating variation:', error);
      throw error;
    }
  }, [user, projectId]);

  const updateVariation = useCallback(async (id: string, updates: Partial<Variation>): Promise<Variation> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert complex objects to JSON strings for database storage
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      // Handle JSON fields that need stringification
      if (updates.cost_breakdown) {
        updateData.cost_breakdown = JSON.stringify(updates.cost_breakdown);
      }
      if (updates.time_impact_details) {
        updateData.time_impact_details = JSON.stringify(updates.time_impact_details);
      }
      if (updates.linked_milestones) {
        updateData.linked_milestones = JSON.stringify(updates.linked_milestones);
      }
      if (updates.linked_tasks) {
        updateData.linked_tasks = JSON.stringify(updates.linked_tasks);
      }
      if (updates.linked_qa_items) {
        updateData.linked_qa_items = JSON.stringify(updates.linked_qa_items);
      }

      const { data, error } = await supabase
        .from('variations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedVariation = transformDatabaseVariation(data);
      setVariations(prev => 
        prev.map(variation => 
          variation.id === id ? updatedVariation : variation
        )
      );
      
      return updatedVariation;
    } catch (error) {
      console.error('Error updating variation:', error);
      throw error;
    }
  }, [user]);

  const sendVariationEmail = useCallback(async (variationId: string): Promise<boolean> => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation?.client_email) {
      throw new Error('No client email found for this variation');
    }

    try {
      const { error } = await supabase.functions.invoke('send-variation-email', {
        body: {
          variation: variation,
          recipientEmail: variation.client_email
        }
      });

      if (error) throw error;

      // Update variation with email sent status
      await updateVariation(variationId, {
        email_sent: true,
        email_sent_date: new Date().toISOString(),
        email_sent_by: user?.id
      });

      return true;
    } catch (error) {
      console.error('Error sending variation email:', error);
      throw error;
    }
  }, [variations, updateVariation, user]);

  useEffect(() => {
    fetchVariations();
  }, [fetchVariations]);

  return {
    variations,
    loading,
    createVariation,
    updateVariation,
    sendVariationEmail,
    refetch: fetchVariations
  };
};
