
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVariationIntegration } from './useVariationIntegration';

export interface EnhancedVariation {
  id: string;
  project_id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  requested_by?: string;
  submitted_by?: string;
  request_date: string;
  submitted_date: string;
  cost_impact: number;
  time_impact: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  category?: string;
  priority: 'high' | 'medium' | 'low';
  client_email?: string;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  email_sent_by?: string;
  cost_breakdown: any[];
  time_impact_details: any;
  gst_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  linked_milestones?: string[];
  budget_impacts?: any[];
  integrationStatus?: 'pending' | 'linked' | 'applied';
}

export const useEnhancedVariations = (projectId: string) => {
  const [variations, setVariations] = useState<EnhancedVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { milestoneLinks, budgetImpacts, updateMilestoneTimeImpact } = useVariationIntegration(projectId);

  const fetchEnhancedVariations = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('variations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching variations:', error);
        toast({
          title: "Error",
          description: "Failed to fetch variations",
          variant: "destructive"
        });
        return;
      }

      // Transform and enhance variations with integration data
      const enhancedVariations = (data || []).map(variation => {
        const linkedMilestones = milestoneLinks
          .filter(link => link.variation_id === variation.id)
          .map(link => link.milestone_id);

        const variationBudgetImpacts = budgetImpacts
          .filter(impact => impact.variation_id === variation.id);

        const integrationStatus = linkedMilestones.length > 0 || variationBudgetImpacts.length > 0 
          ? 'linked' 
          : 'pending';

        return {
          ...variation,
          cost_breakdown: Array.isArray(variation.cost_breakdown) ? variation.cost_breakdown : [],
          time_impact_details: typeof variation.time_impact_details === 'object' ? variation.time_impact_details : {},
          linked_milestones: linkedMilestones,
          budget_impacts: variationBudgetImpacts,
          integrationStatus,
          // Ensure proper typing
          priority: (variation.priority as 'high' | 'medium' | 'low') || 'medium',
          status: variation.status as 'draft' | 'pending_approval' | 'approved' | 'rejected'
        };
      });

      setVariations(enhancedVariations);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVariation = async (variationData: any) => {
    if (!user || !projectId) return null;

    try {
      // Generate variation number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_variation_number', { project_uuid: projectId });

      if (numberError) {
        console.error('Error generating variation number:', numberError);
        toast({
          title: "Error",
          description: "Failed to generate variation number",
          variant: "destructive"
        });
        return null;
      }

      const insertData = {
        project_id: projectId,
        variation_number: numberData,
        title: variationData.title,
        description: variationData.description,
        location: variationData.location,
        submitted_by: user.id,
        requested_by: user.id,
        cost_impact: parseFloat(variationData.costImpact) || variationData.total_amount || 0,
        time_impact: parseInt(variationData.timeImpact) || 0,
        priority: variationData.priority || 'medium',
        status: 'draft',
        category: variationData.category,
        client_email: variationData.clientEmail,
        justification: variationData.justification,
        cost_breakdown: variationData.cost_breakdown || [],
        time_impact_details: variationData.time_impact_details || {},
        gst_amount: variationData.gst_amount || 0,
        total_amount: variationData.total_amount || 0,
      };

      const { data, error } = await supabase
        .from('variations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating variation:', error);
        toast({
          title: "Error",
          description: `Failed to create variation: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: `Variation ${data.variation_number} created successfully`
      });

      await fetchEnhancedVariations();
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const updateVariation = async (id: string, updates: Partial<EnhancedVariation>) => {
    try {
      const { data, error } = await supabase
        .from('variations')
        .update({
          title: updates.title,
          description: updates.description,
          location: updates.location,
          cost_impact: updates.cost_impact,
          time_impact: updates.time_impact,
          status: updates.status,
          category: updates.category,
          priority: updates.priority,
          client_email: updates.client_email,
          justification: updates.justification,
          approved_by: updates.approved_by,
          approval_date: updates.approval_date,
          approval_comments: updates.approval_comments,
          email_sent: updates.email_sent,
          email_sent_date: updates.email_sent_date,
          email_sent_by: updates.email_sent_by,
          cost_breakdown: updates.cost_breakdown,
          time_impact_details: updates.time_impact_details,
          gst_amount: updates.gst_amount,
          total_amount: updates.total_amount
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating variation:', error);
        toast({
          title: "Error",
          description: "Failed to update variation",
          variant: "destructive"
        });
        return null;
      }

      // If variation is approved and has time impact, update linked milestones
      if (updates.status === 'approved' && updates.time_impact) {
        await updateMilestoneTimeImpact(id, updates.time_impact);
      }

      await fetchEnhancedVariations();
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchEnhancedVariations();
  }, [projectId, milestoneLinks, budgetImpacts]);

  return {
    variations,
    loading,
    createVariation,
    updateVariation,
    refetch: fetchEnhancedVariations
  };
};
