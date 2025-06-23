
import React from 'react';
import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string, daysOverdue: number) => {
  switch (status) {
    case 'complete':
      return <Badge className="bg-green-100 text-green-800">✅ Complete</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-100 text-blue-800">🔄 In Progress</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800">🔴 Overdue ({daysOverdue}d)</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>;
  }
};

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'normal':
      return <Badge variant="secondary">Normal</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="secondary">Normal</Badge>;
  }
};

export const getDaysUntilBadge = (daysUntil: number) => {
  if (daysUntil < 0) {
    return <Badge variant="destructive">Overdue</Badge>;
  } else if (daysUntil === 0) {
    return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
  } else if (daysUntil === 1) {
    return <Badge className="bg-yellow-100 text-yellow-800">Due Tomorrow</Badge>;
  } else if (daysUntil <= 3) {
    return <Badge className="bg-yellow-100 text-yellow-800">{daysUntil} days</Badge>;
  } else {
    return <Badge variant="outline">{daysUntil} days</Badge>;
  }
};
