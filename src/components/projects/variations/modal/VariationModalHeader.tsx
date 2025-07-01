
import React from 'react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock } from 'lucide-react';
import { Variation } from '@/types/variations';
import { formatCurrency } from '@/utils/variationTransforms';

interface VariationModalHeaderProps {
  variation: Variation;
  isStatusLocked: boolean;
  isPendingApproval: boolean;
}

const VariationModalHeader: React.FC<VariationModalHeaderProps> = ({
  variation,
  isStatusLocked,
  isPendingApproval
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex justify-between items-start">
      <div>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Variation {variation.variation_number}
          {(isStatusLocked || isPendingApproval) && (
            <Lock className="h-4 w-4 text-amber-500" />
          )}
        </DialogTitle>
        <DialogDescription>
          Detailed information and approval workflow
        </DialogDescription>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(variation.status)}
        <div className="text-right">
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(variation.cost_impact)}
          </div>
          <div className="text-xs text-gray-600">Cost Impact</div>
        </div>
      </div>
    </div>
  );
};

export default VariationModalHeader;
