
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface VariationStatusBadgeProps {
  status: string;
}

const VariationStatusBadge: React.FC<VariationStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'draft':
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default VariationStatusBadge;
