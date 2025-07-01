
import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

const VariationTableHeader: React.FC = () => {
  return (
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
  );
};

export default VariationTableHeader;
