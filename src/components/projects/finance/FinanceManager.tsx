
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calculator, TrendingUp, AlertTriangle, DollarSign, Plus, Link } from 'lucide-react';
import { useCrossModuleNavigation } from '@/hooks/useCrossModuleNavigation';
import BudgetPlanningTable from './BudgetPlanningTable';
import ActualCostTracker from './ActualCostTracker';
import CostSummaryDashboard from './CostSummaryDashboard';
import BudgetItemForm from './BudgetItemForm';

interface FinanceManagerProps {
  projectName: string;
  crossModuleData?: any;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ projectName, crossModuleData }) => {
  const { toast } = useToast();
  const { getCrossModuleAction } = useCrossModuleNavigation();
  const [activeTab, setActiveTab] = useState('budget');
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  // Auto-open budget item form when arriving from cross-module navigation
  useEffect(() => {
    const action = getCrossModuleAction();
    if (action === 'create-budget-item' && crossModuleData) {
      console.log('Auto-opening budget item form with cross-module data:', crossModuleData);
      
      setActiveTab('budget');
      setShowBudgetForm(true);
      
      toast({
        title: "Cross-Module Integration",
        description: `Budget item form auto-opened from variation ${crossModuleData.variationNumber}`,
      });
    }
  }, [crossModuleData, getCrossModuleAction]);

  // Sample budget data
  const budgetSummary = {
    totalBudget: 850000,
    actualCosts: 520000,
    committed: 180000,
    forecast: 735000,
    variationImpact: 45000,
    remainingBudget: 315000
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600';
    if (variance < -10000) return 'text-green-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Finance Manager</h3>
          <p className="text-gray-600">Budget planning, cost tracking, and financial reporting</p>
          {crossModuleData?.fromVariation && (
            <Badge className="mt-2 bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
              <Link className="h-3 w-3" />
              Linked from Variation {crossModuleData.variationNumber}
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowBudgetForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Budget Item
        </Button>
      </div>

      {/* Finance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              ${budgetSummary.totalBudget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Budget</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              ${budgetSummary.actualCosts.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Actual Costs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">
              ${budgetSummary.committed.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Committed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">
              ${budgetSummary.forecast.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Forecast</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-red-600 font-bold">±</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              +${budgetSummary.variationImpact.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Variation Impact</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-green-600 font-bold">$</span>
            </div>
            <div className={`text-2xl font-bold ${getVarianceColor(budgetSummary.remainingBudget)}`}>
              ${budgetSummary.remainingBudget.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Item Form */}
      {showBudgetForm && (
        <BudgetItemForm 
          isOpen={showBudgetForm}
          onClose={() => setShowBudgetForm(false)}
          crossModuleData={crossModuleData}
        />
      )}

      {/* Finance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget">Budget Planning</TabsTrigger>
          <TabsTrigger value="actuals">Actual Costs</TabsTrigger>
          <TabsTrigger value="dashboard">Cost Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-6">
          <BudgetPlanningTable />
        </TabsContent>

        <TabsContent value="actuals" className="mt-6">
          <ActualCostTracker />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <CostSummaryDashboard budgetSummary={budgetSummary} />
        </TabsContent>
      </Tabs>

      {/* Budget Alert */}
      {budgetSummary.forecast > budgetSummary.totalBudget && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-800">
                Budget Forecast Exceeded
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Current forecast (${budgetSummary.forecast.toLocaleString()}) exceeds total budget by $
              {(budgetSummary.forecast - budgetSummary.totalBudget).toLocaleString()}. 
              Review variations and cost commitments.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceManager;
