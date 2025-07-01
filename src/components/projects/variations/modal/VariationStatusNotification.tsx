
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Lock, Clock } from 'lucide-react';

interface VariationStatusNotificationProps {
  canEditVariation: boolean;
  editBlockedReason: string | null;
  isPendingApproval: boolean;
  isStatusLocked: boolean;
}

const VariationStatusNotification: React.FC<VariationStatusNotificationProps> = ({
  canEditVariation,
  editBlockedReason,
  isPendingApproval,
  isStatusLocked
}) => {
  if (canEditVariation && !editBlockedReason) return null;

  const getIcon = () => {
    if (isStatusLocked) return <Lock className="h-4 w-4" />;
    if (isPendingApproval) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getVariant = () => {
    if (isStatusLocked) return 'destructive' as const;
    if (isPendingApproval) return 'default' as const;
    return 'default' as const;
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      {getIcon()}
      <AlertDescription>
        {editBlockedReason || 'This variation has editing restrictions.'}
      </AlertDescription>
    </Alert>
  );
};

export default VariationStatusNotification;
