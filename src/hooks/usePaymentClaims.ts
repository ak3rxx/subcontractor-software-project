
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentClaim {
  id: string;
  project_id: string;
  claimant_company_name: string;
  claimant_abn: string;
  claimant_acn?: string;
  claimant_address: string;
  claimant_suburb: string;
  claimant_postcode: string;
  claimant_email: string;
  claim_number: string;
  claim_amount: number;
  claim_received_date: string;
  contract_number?: string;
  claim_description?: string;
  supporting_documents: any[];
  status: 'received' | 'responded' | 'overdue';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const usePaymentClaims = (projectId?: string) => {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_claims')
        .select(`
          *,
          projects:project_id(name, project_number)
        `)
        .order('claim_received_date', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        supporting_documents: Array.isArray(item.supporting_documents) 
          ? item.supporting_documents 
          : item.supporting_documents ? JSON.parse(item.supporting_documents as string) : []
      })) || [];
      
      setClaims(transformedData);
    } catch (error) {
      console.error('Error fetching payment claims:', error);
      toast({
        title: "Error",
        description: "Failed to load payment claims",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (claimData: Omit<PaymentClaim, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payment_claims')
        .insert(claimData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment claim created successfully"
      });

      await fetchClaims();
      return data;
    } catch (error) {
      console.error('Error creating payment claim:', error);
      toast({
        title: "Error",
        description: "Failed to create payment claim",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateClaim = async (id: string, updates: Partial<PaymentClaim>) => {
    try {
      const { error } = await supabase
        .from('payment_claims')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment claim updated successfully"
      });

      await fetchClaims();
    } catch (error) {
      console.error('Error updating payment claim:', error);
      toast({
        title: "Error",
        description: "Failed to update payment claim",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [projectId]);

  return {
    claims,
    loading,
    createClaim,
    updateClaim,
    refetch: fetchClaims
  };
};
