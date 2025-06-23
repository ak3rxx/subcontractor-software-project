
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, DollarSign, Clock, User, Mail, FileText } from 'lucide-react';

interface Variation {
  id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  submitted_by?: string;
  submitted_date: string;
  cost_impact: number;
  time_impact: number;
  status: string;
  category?: string;
  priority: string;
  client_email?: string;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  email_sent?: boolean;
  email_sent_date?: string;
}

interface VariationDetailsModalProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
}

const VariationDetailsModal: React.FC<VariationDetailsModalProps> = ({ 
  variation, 
  isOpen, 
  onClose 
}) => {
  if (!variation) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Variation {variation.variation_number}
          </DialogTitle>
          <DialogDescription>
            Detailed information for this variation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold">{variation.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(variation.status)}
                {getPriorityBadge(variation.priority)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(variation.cost_impact)}
              </div>
              <div className="text-sm text-gray-600">Cost Impact</div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Submitted:</span>
                <span>{variation.submitted_date}</span>
              </div>
              
              {variation.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Location:</span>
                  <span>{variation.location}</span>
                </div>
              )}

              {variation.submitted_by && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Submitted by:</span>
                  <span>{variation.submitted_by}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Time Impact:</span>
                <span>
                  {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                   variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                </span>
              </div>

              {variation.category && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Category:</span>
                  <Badge variant="outline" className="capitalize">
                    {variation.category}
                  </Badge>
                </div>
              )}

              {variation.client_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Client Email:</span>
                  <span className="text-sm">{variation.client_email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {variation.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {variation.description}
              </p>
            </div>
          )}

          {/* Justification */}
          {variation.justification && (
            <div>
              <h4 className="font-medium mb-2">Justification</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {variation.justification}
              </p>
            </div>
          )}

          {/* Approval Information */}
          {(variation.approved_by || variation.approval_date) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Approval Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {variation.approved_by && (
                    <div>
                      <span className="font-medium">Approved by:</span>
                      <span className="ml-2">{variation.approved_by}</span>
                    </div>
                  )}
                  {variation.approval_date && (
                    <div>
                      <span className="font-medium">Approval date:</span>
                      <span className="ml-2">{variation.approval_date}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Email Status */}
          {variation.email_sent && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Email Status</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ Email Sent
                  </Badge>
                  {variation.email_sent_date && (
                    <span className="text-sm text-gray-600">
                      on {new Date(variation.email_sent_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariationDetailsModal;
