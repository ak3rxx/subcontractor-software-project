
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Send, MapPin } from 'lucide-react';
import VariationStatusBadge from './VariationStatusBadge';
import VariationPriorityBadge from './VariationPriorityBadge';

interface VariationTableProps {
  variations: any[];
  canEditVariations: boolean;
  canSendEmails: boolean;
  canCreateVariations: boolean;
  onViewDetails: (variation: any) => void;
  onEdit: (variation: any) => void;
  onSendEmail: (variationId: string) => void;
  onCreateFirst: () => void;
}

const VariationTable: React.FC<VariationTableProps> = ({
  variations,
  canEditVariations,
  canSendEmails,
  canCreateVariations,
  onViewDetails,
  onEdit,
  onSendEmail,
  onCreateFirst
}) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variations List</CardTitle>
      </CardHeader>
      <CardContent>
        {variations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No variations found</p>
            {canCreateVariations && (
              <Button onClick={onCreateFirst}>
                Create First Variation
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Cost Impact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationTable;
