
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartBar, FileText, DollarSign } from 'lucide-react';
import BudgetPlanningTable from './BudgetPlanningTable';
import ActualCostTracker from './ActualCostTracker';
import CostSummaryDashboard from './CostSummaryDashboard';

interface FinanceManagerProps {
  projectName: string;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ projectName }) => {
  const [activeTab, setActiveTab] = useState('budget');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Finance</h2>
          <p className="text-muted-foreground">Manage budget, track expenses, and forecast project costs</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">Estimator Access</Badge>
      </div>

      <Tabs defaultValue="budget" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Budget Planning
          </TabsTrigger>
          <TabsTrigger value="actual" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Actual Costs
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            Cost Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <BudgetPlanningTable projectName={projectName} />
        </TabsContent>

        <TabsContent value="actual">
          <ActualCostTracker projectName={projectName} />
        </TabsContent>

        <TabsContent value="summary">
          <CostSummaryDashboard projectName={projectName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceManager;
