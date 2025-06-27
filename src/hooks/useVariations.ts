import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

export interface TimeImpactDetails {
  requiresNoticeOfDelay: boolean;
  requiresExtensionOfTime: boolean;
  noticeOfDelayDays?: number;
  extensionOfTimeDays?: number;
}

export interface Variation {
  id: string;
  project_id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  requested_by?: string;
  request_date: string;
  cost_impact: number;
  time_impact: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  category?: string;
  trade?: string;
  priority: 'high' | 'medium' | 'low';
  client_email?: string;
  justification?: string;
  attachments: any[];
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  email_sent_by?: string;
  cost_breakdown: CostBreakdownItem[];
  time_impact_details: TimeImpactDetails;
  gst_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  requires_eot: boolean;
  requires_nod: boolean;
  eot_days: number;
  nod_days: number;
  linked_milestones: string[];
  linked_tasks: string[];
  linked_qa_items: string[];
  originating_rfi_id?: string;
}

// Helper function to safely parse cost breakdown
const parseCostBreakdown = (data: any): CostBreakdownItem[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map((item: any) => ({
      id: item?.id || '',
      description: item?.description || '',
      quantity: Number(item?.quantity) || 0,
      rate: Number(item?.rate) || 0,
      subtotal: Number(item?.subtotal) || 0,
    }));
  }
  return [];
};

// Helper function to safely parse time impact details
const parseTimeImpactDetails = (data: any): TimeImpactDetails => {
  if (!data || typeof data !== 'object') {
    return { requiresNoticeOfDelay: false, requiresExtensionOfTime: false };
  }
  return {
    requiresNoticeOfDelay: Boolean(data.requiresNoticeOfDelay),
    requiresExtensionOfTime: Boolean(data.requiresExtensionOfTime),
    noticeOfDelayDays: data.noticeOfDelayDays ? Number(data.noticeOfDelayDays) : undefined,
    extensionOfTimeDays: data.extensionOfTimeDays ? Number(data.extensionOfTimeDays) : undefined,
  };
};

// Helper function to transform database item to Variation interface
const transformDatabaseItem = (item: any): Variation => ({
  id: item.id,
  project_id: item.project_id,
  variation_number: item.variation_number,
  title: item.title,
  description: item.description,
  location: item.location || '',
  requested_by: item.requested_by,
  request_date: item.request_date || item.created_at.split('T')[0],
  cost_impact: item.cost_impact || 0,
  time_impact: item.time_impact || 0,
  status: item.status as 'draft' | 'pending_approval' | 'approved' | 'rejected',
  category: item.category || '',
  trade: item.trade || undefined,
  priority: (item.priority as 'high' | 'medium' | 'low') || 'medium',
  client_email: item.client_email || '',
  justification: item.justification || '',
  attachments: [],
  approved_by: item.approved_by,
  approval_date: item.approval_date,
  approval_comments: item.approval_comments || '',
  email_sent: item.email_sent || false,
  email_sent_date: item.email_sent_date,
  email_sent_by: item.email_sent_by,
  cost_breakdown: parseCostBreakdown(item.cost_breakdown),
  time_impact_details: parseTimeImpactDetails(item.time_impact_details),
  gst_amount: item.gst_amount || 0,
  total_amount: item.total_amount || 0,
  requires_eot: item.requires_eot || false,
  requires_nod: item.requires_nod || false,
  eot_days: item.eot_days || 0,
  nod_days: item.nod_days || 0,
  linked_milestones: item.linked_milestones || [],
  linked_tasks: item.linked_tasks || [],
  linked_qa_items: item.linked_qa_items || [],
  originating_rfi_id: item.originating_rfi_id,
  created_at: item.created_at,
  updated_at: item.updated_at
});

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

      const transformedData = (data || []).map(transformDatabaseItem);
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
        cost_impact: parseFloat(variationData.costImpact) || variationData.total_amount || 0,
        time_impact: parseInt(variationData.timeImpact) || 0,
        priority: variationData.priority || 'medium',
        status: 'draft',
        category: variationData.category,
        trade: variationData.trade,
        client_email: variationData.clientEmail,
        justification: variationData.justification,
        cost_breakdown: variationData.cost_breakdown || [],
        time_impact_details: variationData.time_impact_details || { requiresNoticeOfDelay: false, requiresExtensionOfTime: false },
        gst_amount: variationData.gst_amount || 0,
        total_amount: variationData.total_amount || 0,
        requires_eot: variationData.requires_eot || false,
        requires_nod: variationData.requires_nod || false,
        eot_days: variationData.eot_days || 0,
        nod_days: variationData.nod_days || 0,
        linked_milestones: variationData.linked_milestones || [],
        linked_tasks: variationData.linked_tasks || [],
        linked_qa_items: variationData.linked_qa_items || []
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

      const transformedData = transformDatabaseItem(data);
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
      const dbUpdates: any = {};
      
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.cost_impact !== undefined) dbUpdates.cost_impact = updates.cost_impact;
      if (updates.time_impact !== undefined) dbUpdates.time_impact = updates.time_impact;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.trade !== undefined) dbUpdates.trade = updates.trade;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.client_email !== undefined) dbUpdates.client_email = updates.client_email;
      if (updates.justification !== undefined) dbUpdates.justification = updates.justification;
      if (updates.approved_by !== undefined) dbUpdates.approved_by = updates.approved_by;
      if (updates.approval_date !== undefined) dbUpdates.approval_date = updates.approval_date;
      if (updates.approval_comments !== undefined) dbUpdates.approval_comments = updates.approval_comments;
      if (updates.email_sent !== undefined) dbUpdates.email_sent = updates.email_sent;
      if (updates.email_sent_date !== undefined) dbUpdates.email_sent_date = updates.email_sent_date;
      if (updates.email_sent_by !== undefined) dbUpdates.email_sent_by = updates.email_sent_by;
      if (updates.requested_by !== undefined) dbUpdates.requested_by = updates.requested_by;
      if (updates.request_date !== undefined) dbUpdates.request_date = updates.request_date;
      if (updates.cost_breakdown !== undefined) dbUpdates.cost_breakdown = updates.cost_breakdown;
      if (updates.time_impact_details !== undefined) dbUpdates.time_impact_details = updates.time_impact_details;
      if (updates.gst_amount !== undefined) dbUpdates.gst_amount = updates.gst_amount;
      if (updates.total_amount !== undefined) dbUpdates.total_amount = updates.total_amount;
      if (updates.requires_eot !== undefined) dbUpdates.requires_eot = updates.requires_eot;
      if (updates.requires_nod !== undefined) dbUpdates.requires_nod = updates.requires_nod;
      if (updates.eot_days !== undefined) dbUpdates.eot_days = updates.eot_days;
      if (updates.nod_days !== undefined) dbUpdates.nod_days = updates.nod_days;
      if (updates.linked_milestones !== undefined) dbUpdates.linked_milestones = updates.linked_milestones;
      if (updates.linked_tasks !== undefined) dbUpdates.linked_tasks = updates.linked_tasks;
      if (updates.linked_qa_items !== undefined) dbUpdates.linked_qa_items = updates.linked_qa_items;

      const { data, error } = await supabase
        .from('variations')
        .update(dbUpdates)
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

      const transformedData = transformDatabaseItem(data);
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

  const sendVariationEmail = async (variationId: string) => {
    if (!user) return false;

    try {
      const variation = variations.find(v => v.id === variationId);
      if (!variation || !variation.client_email) {
        toast({
          title: "Error",
          description: "No client email found for this variation",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('send-variation-email', {
        body: {
          variation: variation,
          recipientEmail: variation.client_email
        }
      });

      if (error) {
        console.error('Error sending email:', error);
        toast({
          title: "Error",
          description: "Failed to send variation email",
          variant: "destructive"
        });
        return false;
      }

      const updateResult = await updateVariation(variationId, {
        email_sent: true,
        email_sent_date: new Date().toISOString(),
        email_sent_by: user.id
      });

      if (updateResult) {
        toast({
          title: "Success",
          description: `Variation email sent to ${variation.client_email}`,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending variation email:', error);
      toast({
        title: "Error",
        description: "Failed to send variation email",
        variant: "destructive"
      });
      return false;
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
    sendVariationEmail,
    refetch: fetchVariations
  };
};
