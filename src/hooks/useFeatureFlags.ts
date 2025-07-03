
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  description?: string;
}

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, description')
        .order('flag_name');

      if (error) {
        console.error('Error fetching feature flags:', error);
        return;
      }

      setFlags(data as FeatureFlag[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (flagName: string): boolean => {
    const flag = flags.find(f => f.flag_name === flagName);
    return flag?.is_enabled ?? false;
  };

  const toggleFlag = async (flagName: string): Promise<boolean> => {
    if (!isDeveloper()) return false;

    try {
      const currentFlag = flags.find(f => f.flag_name === flagName);
      const newValue = !currentFlag?.is_enabled;

      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: newValue, updated_at: new Date().toISOString() })
        .eq('flag_name', flagName);

      if (error) {
        console.error('Error toggling feature flag:', error);
        return false;
      }

      // Update local state
      setFlags(prev => prev.map(f => 
        f.flag_name === flagName ? { ...f, is_enabled: newValue } : f
      ));

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  return {
    flags,
    loading,
    isEnabled,
    toggleFlag,
    refetch: fetchFlags
  };
};
