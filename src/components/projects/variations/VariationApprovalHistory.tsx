
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, XCircle, Clock, Send, MessageSquare, FileText, 
  Unlock, History, Loader2 
} from 'lucide-react';

interface VariationApprovalHistoryProps {
  auditTrail: any[];
  loading: boolean;
}

const VariationApprovalHistory: React.FC<VariationApprovalHistoryProps> = ({
  auditTrail,
  loading
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'submit':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'unlock':
        return <Unlock className="h-4 w-4 text-orange-600" />;
      case 'email_sent':
        return <Send className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatActionType = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'Created';
      case 'submit': return 'Submitted for Approval';
      case 'approve': return 'Approved';
      case 'reject': return 'Rejected';
      case 'unlock': return 'Unlocked';
      case 'email_sent': return 'Email Sent';
      default: return actionType;
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter audit trail to show only approval-related events
  const approvalHistory = auditTrail.filter(entry => 
    ['create', 'submit', 'approve', 'reject', 'unlock', 'email_sent'].includes(entry.action_type)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Approval History
          {approvalHistory.length > 0 && (
            <Badge variant="outline">{approvalHistory.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading approval history...</span>
          </div>
        ) : approvalHistory.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="space-y-4 pr-4">
              {approvalHistory.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    {getActionIcon(entry.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{formatActionType(entry.action_type)}</span>
                      {entry.status_to && getStatusBadge(entry.status_to)}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      by {entry.user_name} on {new Date(entry.action_timestamp).toLocaleString()}
                    </div>
                    
                    {/* Status changes */}
                    {entry.status_from && entry.status_to && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Status change:</span> 
                        <span className="ml-1">{entry.status_from} → {entry.status_to}</span>
                      </div>
                    )}
                    
                    {/* Comments */}
                    {entry.comments && (
                      <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {entry.comments}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No approval history available</p>
            <p className="text-sm">Actions will appear here as the variation progresses through approval</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationApprovalHistory;
