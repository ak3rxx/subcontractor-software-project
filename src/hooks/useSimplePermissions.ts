import { useAuth } from '@/contexts/AuthContext';

export const useSimplePermissions = () => {
  const { user } = useAuth();
  
  return {
    canAccess: () => !!user,
    canEdit: () => !!user,
    canAdmin: () => !!user,
    canApprove: () => !!user,
    loading: false
  };
};