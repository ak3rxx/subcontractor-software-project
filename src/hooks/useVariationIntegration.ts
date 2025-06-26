
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VariationMilestone {
  id: string;
  variation_id: string;
  milestone_id: string;
  time_impact_days: number;
  created_at: string;
}

export interface VariationBudgetImpact {
  id: string;
  variation_id: string;
  budget_item_id: string;
  impact_amount: number;
  impact_type: 'increase' | 'decrease';
  created_at: string;
}

export interface ProjectVariationImpact {
  total_approved_cost: number;
  total_pending_cost: number;
  total_time_impact: number;
}

export const useVariationIntegration = (projectId: string) => {
  const [milestoneLinks, setMilestoneLinks] = useState<VariationMilestone[]>([]);
  const [budgetImpacts, setBudgetImpacts] = useState<VariationBudgetImpact[]>([]);
  const [projectImpact, setProjectImpact] = useState<ProjectVariationImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVariationIntegration = async () => {
    if (!projectId) return;

    try {
      // Fetch milestone links
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('variation_milestones')
        .select('*')
        .in('variation_id', 
          supabase.from('variations').select('id').eq('project_id', projectId)
        );

      if (milestoneError) {
        console.error('Error fetching milestone links:', milestoneError);
      } else {
        setMilestoneLinks(milestoneData || []);
      }

      // Fetch budget impacts
      const { data: budgetData, error: budgetError } = await supabase
        .from('variation_budget_impacts')
        .select('*')
        .in('variation_id', 
          supabase.from('variations').select('id').eq('project_id', projectId)
        );

      if (budgetError) {
        console.error('Error fetching budget impacts:', budgetError);
      } else {
        setBudgetImpacts(budgetData || []);
      }

      // Calculate project impact
      const { data: impactData, error: impactError } = await supabase
        .rpc('calculate_project_variation_impact', { project_uuid: projectId });

      if (impactError) {
        console.error('Error calculating project impact:', impactError);
      } else if (impactData && impactData.length > 0) {
        setProjectImpact(impactData[0]);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkVariationToMilestone = async (variationId: string, milestoneId: string, timeImpactDays: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('variation_milestones')
        .insert({
          variation_id: variationId,
          milestone_id: milestoneId,
          time_impact_days: timeImpactDays
        });

      if (error) {
        console.error('Error linking variation to milestone:', error);
        toast({
          title: "Error",
          description: "Failed to link variation to milestone",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Variation linked to milestone successfully"
      });

      await fetchVariationIntegration();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const createBudgetImpact = async (
    variationId: string, 
    budgetItemId: string, 
    impactAmount: number, 
    impactType: 'increase' | 'decrease'
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('variation_budget_impacts')
        .insert({
          variation_id: variationId,
          budget_item_id: budgetItemId,
          impact_amount: impactAmount,
          impact_type: impactType
        });

      if (error) {
        console.error('Error creating budget impact:', error);
        toast({
          title: "Error",
          description: "Failed to create budget impact",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Budget impact created successfully"
      });

      await fetchVariationIntegration();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateMilestoneTimeImpact = async (variationId: string, approvedTimeImpact: number) => {
    if (!user) return false;

    try {
      // Get linked milestones for this variation
      const linkedMilestones = milestoneLinks.filter(link => link.variation_id === variationId);
      
      // Update each linked milestone
      for (const link of linkedMilestones) {
        const { error } = await supabase
          .from('programme_milestones')
          .update({
            variation_time_impact: approvedTimeImpact,
            affected_by_variations: supabase.sql`
              CASE 
                WHEN affected_by_variations ? ${variationId} 
                THEN affected_by_variations 
                ELSE affected_by_variations || ${JSON.stringify([variationId])}::jsonb
              END
            `
          })
          .eq('id', link.milestone_id);

        if (error) {
          console.error('Error updating milestone:', error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating milestone time impact:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchVariationIntegration();
  }, [projectId]);

  return {
    milestoneLinks,
    budgetImpacts,
    projectImpact,
    loading,
    linkVariationToMilestone,
    createBudgetImpact,
    updateMilestoneTimeImpact,
    refetch: fetchVariationIntegration
  };
};
