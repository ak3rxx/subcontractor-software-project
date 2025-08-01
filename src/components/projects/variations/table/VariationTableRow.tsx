
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit, Send, MapPin, Lock } from 'lucide-react';
import VariationStatusBadge from '../VariationStatusBadge';
import VariationPriorityBadge from '../VariationPriorityBadge';
import { useVariationEditPermissions } from '@/hooks/useVariationEditPermissions';

interface VariationTableRowProps {
  variation: any;
  canEditVariations: boolean;
  canSendEmails: boolean;
  onViewDetails: (variation: any) => void;
  onEdit: (variation: any) => void;
  onSendEmail: (variationId: string) => void;
}

const VariationTableRow: React.FC<VariationTableRowProps> = ({
  variation,
  canEditVariations,
  canSendEmails,
  onViewDetails,
  onEdit,
  onSendEmail
}) => {
  const { canEditVariation, editBlockedReason } = useVariationEditPermissions(variation);
  
  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const getEditTooltipText = () => {
    if (!canEditVariations) return "You don't have permission to edit variations";
    if (editBlockedReason) return editBlockedReason;
    return "Edit Variation";
  };

  const getEditIcon = () => {
    if (!canEditVariations || editBlockedReason) {
      return <Lock className="h-4 w-4" />;
    }
    return <Edit className="h-4 w-4" />;
  };

  return (
    <TableRow key={variation.id}>
      <TableCell className="font-medium">
        {variation.variation_number}
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{variation.title}</div>
          {variation.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {variation.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <VariationStatusBadge status={variation.status} />
      </TableCell>
      <TableCell>
        <VariationPriorityBadge priority={variation.priority} />
      </TableCell>
      <TableCell>
        <span className={`font-semibold ${
          (variation.total_amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(variation.total_amount || 0)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{variation.location || 'Not specified'}</span>
        </div>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(variation)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Variation Details</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(variation)}
                  disabled={!canEditVariations || !!editBlockedReason}
                  className={(!canEditVariations || editBlockedReason) ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {getEditIcon()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getEditTooltipText()}</p>
              </TooltipContent>
            </Tooltip>
            
            {canSendEmails && variation.client_email && !variation.email_sent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSendEmail(variation.id)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send Email to Client</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
};

export default VariationTableRow;
