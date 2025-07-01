
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Send, MapPin } from 'lucide-react';
import VariationStatusBadge from '../VariationStatusBadge';
import VariationPriorityBadge from '../VariationPriorityBadge';

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
  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(variation)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canEditVariations && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(variation)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {canSendEmails && variation.client_email && !variation.email_sent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendEmail(variation.id)}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default VariationTableRow;
