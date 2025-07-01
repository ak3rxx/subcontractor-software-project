
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Send, Calendar, MapPin } from 'lucide-react';
import { Variation } from '@/types/variations';
import { formatCurrency } from '@/utils/variationTransforms';
import { VARIATION_STATUS_OPTIONS, VARIATION_PRIORITY_OPTIONS } from '@/constants/variations';

interface VariationListItemProps {
  variation: Variation;
  onClick?: () => void;
  onEdit?: () => void;
  onSendEmail?: () => void;
  canEdit?: boolean;
  canSendEmails?: boolean;
}

const VariationListItem: React.FC<VariationListItemProps> = ({
  variation,
  onClick,
  onEdit,
  onSendEmail,
  canEdit = false,
  canSendEmails = false
}) => {
  const statusConfig = VARIATION_STATUS_OPTIONS.find(s => s.value === variation.status);
  const priorityConfig = VARIATION_PRIORITY_OPTIONS.find(p => p.value === variation.priority);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1" onClick={onClick}>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{variation.variation_number}</h3>
              <Badge className={getStatusBadgeColor(variation.status)}>
                {statusConfig?.label || variation.status}
              </Badge>
              <Badge className={getPriorityBadgeColor(variation.priority)}>
                {priorityConfig?.label || variation.priority}
              </Badge>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">{variation.title}</h4>
            
            {variation.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{variation.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(variation.created_at).toLocaleDateString()}</span>
              </div>
              {variation.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{variation.location}</span>
                </div>
              )}
              {variation.trade && (
                <Badge variant="outline" className="text-xs">
                  {variation.trade}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(variation.cost_impact)}
              </div>
              {variation.time_impact > 0 && (
                <div className="text-sm text-gray-600">
                  +{variation.time_impact} days
                </div>
              )}
              {variation.email_sent && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Email Sent
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {canSendEmails && variation.client_email && !variation.email_sent && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendEmail?.();
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariationListItem;
