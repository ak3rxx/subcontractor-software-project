
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SmartCategory {
  category_name: string;
  usage_count: number;
}

export const useSmartCategories = (tradeType?: string) => {
  const [categories, setCategories] = useState<SmartCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) return;

    try {
      // Get user's organization
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgUser) return;

      // Call the smart categories function
      const { data, error } = await supabase
        .rpc('get_smart_categories', {
          org_id: orgUser.organization_id,
          trade_type: tradeType || null
        });

      if (error) {
        console.error('Error fetching smart categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryUsage = async (category: string, trade: string = 'general') => {
    if (!user) return;

    try {
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgUser) return;

      await supabase.rpc('update_category_usage', {
        org_id: orgUser.organization_id,
        category: category,
        trade: trade
      });

      // Refresh categories
      fetchCategories();
    } catch (error) {
      console.error('Error updating category usage:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user, tradeType]);

  return {
    categories,
    loading,
    updateCategoryUsage,
    refetch: fetchCategories
  };
};
