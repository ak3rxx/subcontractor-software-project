
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import ActualCostTracker from '@/components/projects/finance/ActualCostTracker';
import CostSummaryDashboard from '@/components/projects/finance/CostSummaryDashboard';

const BudgetOverview = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle className="text-2xl">Budget Tracking & Cost Management</CardTitle>
              <p className="text-muted-foreground">
                Monitor budgets, track actual costs, and analyze financial performance
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Tracking Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Cost Overview
          </TabsTrigger>
          <TabsTrigger value="actual-costs" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Actual Costs
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Project Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Overview Dashboard</h3>
                <p className="text-gray-600">
                  Cross-project budget overview and analytics will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actual-costs" className="mt-6">
          <ActualCostTracker projectName="All Projects" />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <CostSummaryDashboard projectName="All Projects" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetOverview;
