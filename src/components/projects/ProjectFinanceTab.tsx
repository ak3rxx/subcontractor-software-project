
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ExternalLink, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import FinanceManager from './finance/FinanceManager';

interface ProjectFinanceTabProps {
  projectName: string;
  projectId: string;
}

const ProjectFinanceTab: React.FC<ProjectFinanceTabProps> = ({ projectName, projectId }) => {
  // Mock project-specific financial data
  const projectFinance = {
    totalBudget: 850000,
    actualCosts: 520000,
    committed: 180000,
    remainingBudget: 315000,
    variationImpact: 45000,
    paymentClaims: 2,
    pendingInvoices: 1
  };

  return (
    <div className="space-y-6">
      {/* Project Finance Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Project Finance Summary
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Financial overview for {projectName}
              </p>
            </div>
            <Link to="/finance">
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Finance Module
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${projectFinance.totalBudget.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ${projectFinance.actualCosts.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Actual Costs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${projectFinance.committed.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Committed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${projectFinance.remainingBudget.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Finance Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Finance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/finance?tab=invoices" className="block">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Create Invoice</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Generate invoice for this project</p>
              </div>
            </Link>

            <Link to="/finance?tab=payment-claims" className="block">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Payment Claims</span>
                  <Badge>{projectFinance.paymentClaims}</Badge>
                </div>
                <p className="text-sm text-gray-600">Manage ACT payment claims</p>
              </div>
            </Link>

            <Link to="/finance?tab=budget-tracking" className="block">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Budget Analysis</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">View detailed budget reports</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Full Finance Manager Component (existing functionality) */}
      <FinanceManager projectName={projectName} />
    </div>
  );
};

export default ProjectFinanceTab;
