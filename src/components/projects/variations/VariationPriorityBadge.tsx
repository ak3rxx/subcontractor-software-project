
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface VariationPriorityBadgeProps {
  priority: string;
}

const VariationPriorityBadge: React.FC<VariationPriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case 'high':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          High
        </Badge>
      );
    case 'medium':
      return <Badge variant="secondary">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="secondary">Medium</Badge>;
  }
};

export default VariationPriorityBadge;
