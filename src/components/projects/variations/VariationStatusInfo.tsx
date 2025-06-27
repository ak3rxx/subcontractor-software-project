
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';

interface VariationStatusInfoProps {
  variation: any;
}

const VariationStatusInfo: React.FC<VariationStatusInfoProps> = ({ variation }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Status</span>
          {getStatusBadge(variation.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {variation.status !== 'draft' && (
          <div className="space-y-3">
            {variation.request_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Submitted:</span>
                <span>{variation.request_date}</span>
              </div>
            )}
            
            {variation.approved_by && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Reviewed by:</span>
                <span>{variation.approved_by}</span>
              </div>
            )}
            
            {variation.approval_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Decision date:</span>
                <span>{variation.approval_date}</span>
              </div>
            )}
            
            {variation.approval_comments && (
              <div className="space-y-1">
                <span className="font-medium text-sm">Comments:</span>
                <div className="text-sm text-gray-700 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                  {variation.approval_comments}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationStatusInfo;
