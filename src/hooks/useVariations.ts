
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

      // Transform the data to match our interface, mapping database fields to interface fields
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        project_id: item.project_id,
        variation_number: item.variation_number,
        title: item.title,
        description: item.description,
        location: item.location || '',
        submitted_by: item.requested_by,
        submitted_date: item.request_date || item.created_at.split('T')[0],
        cost_impact: item.cost_impact || 0,
        time_impact: 0, // Not in database, default to 0
        status: item.status as 'draft' | 'pending' | 'approved' | 'rejected',
        category: item.category,
        priority: item.priority as 'high' | 'normal' | 'low',
        client_email: item.client_email,
        justification: item.justification,
        attachments: [], // Not in database, default to empty array
        approved_by: item.approved_by,
        approval_date: item.approval_date,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setVariations(transformedData);
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
        requested_by: user.id,
        cost_impact: parseFloat(variationData.costImpact) || 0,
        priority: variationData.priority || 'normal',
        status: 'pending',
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

      // Transform the returned data to match our interface
      const transformedData = {
        id: data.id,
        project_id: data.project_id,
        variation_number: data.variation_number,
        title: data.title,
        description: data.description,
        location: data.location || '',
        submitted_by: data.requested_by,
        submitted_date: data.request_date || data.created_at.split('T')[0],
        cost_impact: data.cost_impact || 0,
        time_impact: 0,
        status: data.status as 'draft' | 'pending' | 'approved' | 'rejected',
        category: data.category || '',
        priority: data.priority as 'high' | 'normal' | 'low',
        client_email: data.client_email || '',
        justification: data.justification || '',
        attachments: [],
        approved_by: data.approved_by,
        approval_date: data.approval_date,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setVariations(prev => [transformedData, ...prev]);
      return transformedData;
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

      // Transform the returned data to match our interface
      const transformedData = {
        id: data.id,
        project_id: data.project_id,
        variation_number: data.variation_number,
        title: data.title,
        description: data.description,
        location: data.location || '',
        submitted_by: data.requested_by,
        submitted_date: data.request_date || data.created_at.split('T')[0],
        cost_impact: data.cost_impact || 0,
        time_impact: 0,
        status: data.status as 'draft' | 'pending' | 'approved' | 'rejected',
        category: data.category || '',
        priority: data.priority as 'high' | 'normal' | 'low',
        client_email: data.client_email || '',
        justification: data.justification || '',
        attachments: [],
        approved_by: data.approved_by,
        approval_date: data.approval_date,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setVariations(prev => 
        prev.map(variation => 
          variation.id === id ? transformedData : variation
        )
      );

      return transformedData;
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
