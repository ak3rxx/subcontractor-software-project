
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';
import VariationTableHeader from './table/VariationTableHeader';
import VariationTableRow from './table/VariationTableRow';
import VariationTableEmpty from './table/VariationTableEmpty';

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Variations List</CardTitle>
      </CardHeader>
      <CardContent>
        {variations.length === 0 ? (
          <VariationTableEmpty
            canCreateVariations={canCreateVariations}
            onCreateFirst={onCreateFirst}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <VariationTableHeader />
              <TableBody>
                {variations.map((variation) => (
                  <VariationTableRow
                    key={variation.id}
                    variation={variation}
                    canEditVariations={canEditVariations}
                    canSendEmails={canSendEmails}
                    onViewDetails={onViewDetails}
                    onEdit={onEdit}
                    onSendEmail={onSendEmail}
                  />
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
