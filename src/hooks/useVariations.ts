
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Variation {
  id: string;
  project_id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  submitted_by?: string;
  submitted_date: string;
  cost_impact: number;
  time_impact: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  category?: string;
  priority: 'high' | 'normal' | 'low';
  client_email?: string;
  justification?: string;
  attachments: any[];
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export const useVariations = (projectId: string) => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVariations = async () => {
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

      setVariations(data || []);
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
        cost_impact: parseFloat(variationData.costImpact) || 0,
        time_impact: parseInt(variationData.timeImpact) || 0,
        category: variationData.category,
        priority: variationData.priority || 'normal',
        client_email: variationData.clientEmail,
        justification: variationData.justification,
        status: 'pending',
        attachments: variationData.attachments || []
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

      setVariations(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create variation",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateVariation = async (id: string, updates: Partial<Variation>) => {
    try {
      const { data, error } = await supabase
        .from('variations')
        .update(updates)
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

      setVariations(prev => 
        prev.map(variation => 
          variation.id === id ? data : variation
        )
      );

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchVariations();
  }, [projectId]);

  return {
    variations,
    loading,
    createVariation,
    updateVariation,
    refetch: fetchVariations
  };
};
