
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentSchedule {
  id: string;
  payment_claim_id: string;
  project_id: string;
  schedule_number: string;
  respondent_company_name: string;
  respondent_abn: string;
  respondent_acn?: string;
  respondent_address: string;
  respondent_suburb: string;
  respondent_postcode: string;
  respondent_email: string;
  scheduled_amount: number;
  withheld_amount: number;
  withholding_reasons: any[];
  contract_clauses?: string;
  supporting_evidence: any[];
  service_method: 'email' | 'post' | 'in-person';
  service_proof?: string;
  service_date?: string;
  pdf_path?: string;
  word_path?: string;
  legal_deadline: string;
  status: 'draft' | 'sent' | 'delivered';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WithholdingSuggestion {
  reason: string;
  suggestion_type: string;
  evidence_count: number;
  confidence_score: number;
}

export const usePaymentSchedules = (projectId?: string) => {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_schedules')
        .select(`
          *,
          payment_claims:payment_claim_id(*),
          projects:project_id(name, project_number)
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        payment_claim_id: item.payment_claim_id,
        project_id: item.project_id,
        schedule_number: item.schedule_number,
        respondent_company_name: item.respondent_company_name,
        respondent_abn: item.respondent_abn,
        respondent_acn: item.respondent_acn,
        respondent_address: item.respondent_address,
        respondent_suburb: item.respondent_suburb,
        respondent_postcode: item.respondent_postcode,
        respondent_email: item.respondent_email,
        scheduled_amount: item.scheduled_amount,
        withheld_amount: item.withheld_amount,
        withholding_reasons: Array.isArray(item.withholding_reasons) 
          ? item.withholding_reasons 
          : item.withholding_reasons ? JSON.parse(item.withholding_reasons as string) : [],
        contract_clauses: item.contract_clauses,
        supporting_evidence: Array.isArray(item.supporting_evidence) 
          ? item.supporting_evidence 
          : item.supporting_evidence ? JSON.parse(item.supporting_evidence as string) : [],
        service_method: (item.service_method as 'email' | 'post' | 'in-person') || 'email',
        service_proof: item.service_proof,
        service_date: item.service_date,
        pdf_path: item.pdf_path,
        word_path: item.word_path,
        legal_deadline: item.legal_deadline,
        status: (item.status as 'draft' | 'sent' | 'delivered') || 'draft',
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
      
      setSchedules(transformedData);
    } catch (error) {
      console.error('Error fetching payment schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load payment schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateScheduleNumber = async (projectId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('generate_payment_schedule_number', { project_uuid: projectId });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating schedule number:', error);
      return 'PS-0001';
    }
  };

  const getWithholdingSuggestions = async (projectId: string): Promise<WithholdingSuggestion[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_withholding_suggestions', { project_uuid: projectId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting withholding suggestions:', error);
      return [];
    }
  };

  const createSchedule = async (scheduleData: Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'schedule_number' | 'legal_deadline'>) => {
    try {
      // Get the schedule number first
      const scheduleNumber = await generateScheduleNumber(scheduleData.project_id);
      
      // Prepare the data for insertion, including a temporary legal_deadline that will be overwritten by the trigger
      const insertData = {
        payment_claim_id: scheduleData.payment_claim_id,
        project_id: scheduleData.project_id,
        schedule_number: scheduleNumber,
        respondent_company_name: scheduleData.respondent_company_name,
        respondent_abn: scheduleData.respondent_abn,
        respondent_acn: scheduleData.respondent_acn,
        respondent_address: scheduleData.respondent_address,
        respondent_suburb: scheduleData.respondent_suburb,
        respondent_postcode: scheduleData.respondent_postcode,
        respondent_email: scheduleData.respondent_email,
        scheduled_amount: scheduleData.scheduled_amount,
        withheld_amount: scheduleData.withheld_amount,
        withholding_reasons: scheduleData.withholding_reasons,
        contract_clauses: scheduleData.contract_clauses,
        supporting_evidence: scheduleData.supporting_evidence,
        service_method: scheduleData.service_method,
        service_proof: scheduleData.service_proof,
        service_date: scheduleData.service_date,
        status: scheduleData.status,
        created_by: scheduleData.created_by,
        legal_deadline: new Date().toISOString().split('T')[0] // Temporary value, will be overwritten by trigger
      };

      const { data, error } = await supabase
        .from('payment_schedules')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment schedule created successfully"
      });

      await fetchSchedules();
      return data;
    } catch (error) {
      console.error('Error creating payment schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create payment schedule",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<PaymentSchedule>) => {
    try {
      const { error } = await supabase
        .from('payment_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment schedule updated successfully"
      });

      await fetchSchedules();
    } catch (error) {
      console.error('Error updating payment schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update payment schedule",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [projectId]);

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    generateScheduleNumber,
    getWithholdingSuggestions,
    refetch: fetchSchedules
  };
};
