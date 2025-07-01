
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PaymentSchedule, WithholdingSuggestion } from '@/types/paymentSchedules';
import {
  fetchPaymentSchedules,
  generateScheduleNumber,
  getWithholdingSuggestions,
  createPaymentSchedule,
  updatePaymentSchedule
} from '@/services/paymentScheduleService';

export const usePaymentSchedules = (projectId?: string) => {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSchedulesData = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentSchedules(projectId);
      setSchedules(data);
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

  const createSchedule = async (scheduleData: Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'schedule_number' | 'legal_deadline'>) => {
    try {
      const data = await createPaymentSchedule(scheduleData);

      toast({
        title: "Success",
        description: "Payment schedule created successfully"
      });

      await fetchSchedulesData();
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
      await updatePaymentSchedule(id, updates);

      toast({
        title: "Success",
        description: "Payment schedule updated successfully"
      });

      await fetchSchedulesData();
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
    fetchSchedulesData();
  }, [projectId]);

  return {
    schedules,
    loading,
    createSchedule,
    updateSchedule,
    generateScheduleNumber,
    getWithholdingSuggestions,
    refetch: fetchSchedulesData
  };
};

// Export types for backward compatibility
export type { PaymentSchedule, WithholdingSuggestion };
