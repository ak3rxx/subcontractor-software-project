
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Variation } from '@/types/variations';

interface VariationSummaryCardsProps {
  variations: Variation[];
  summary?: {
    total: number;
    draft: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    totalCostImpact: number;
    averageTimeImpact: number;
  };
  statusCounts?: Record<string, number>;
  priorityCounts?: Record<string, number>;
}

const VariationSummaryCards: React.FC<VariationSummaryCardsProps> = ({ 
  variations, 
  summary,
  statusCounts,
  priorityCounts 
}) => {
  // Use summary if provided, otherwise calculate from variations
  const stats = summary || {
    total: variations.length,
    draft: variations.filter(v => v.status === 'draft').length,
    pending_approval: variations.filter(v => v.status === 'pending_approval').length,
    approved: variations.filter(v => v.status === 'approved').length,
    rejected: variations.filter(v => v.status === 'rejected').length,
    totalCostImpact: variations.reduce((sum, v) => sum + (v.cost_impact || 0), 0),
    averageTimeImpact: variations.length > 0 ? Math.round(variations.reduce((sum, v) => sum + (v.time_impact || 0), 0) / variations.length) : 0
  };

  const approvedValue = variations
    .filter(v => v.status === 'approved')
    .reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const pendingCount = statusCounts?.pending_approval || stats.pending_approval;
  const highPriorityCount = priorityCounts?.high || variations.filter(v => v.priority === 'high').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-tour="variation-summary">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variations</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Value</p>
              <p className="text-2xl font-bold text-green-600">
                ${approvedValue.toLocaleString()}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {highPriorityCount}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationSummaryCards;
