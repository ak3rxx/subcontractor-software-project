
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface VariationSummaryCardsProps {
  variations: any[];
}

const VariationSummaryCards: React.FC<VariationSummaryCardsProps> = ({ variations }) => {
  const approvedValue = variations
    .filter(v => v.status === 'approved')
    .reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const pendingCount = variations.filter(v => v.status === 'pending_approval').length;
  const highPriorityCount = variations.filter(v => v.priority === 'high').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Variations</p>
              <p className="text-2xl font-bold">{variations.length}</p>
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
