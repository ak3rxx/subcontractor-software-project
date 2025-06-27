
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, MessageSquare, Calculator, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface CrossModuleIntegrationBarProps {
  variation: any;
}

const CrossModuleIntegrationBar: React.FC<CrossModuleIntegrationBarProps> = ({ variation }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const createCrossModuleUrl = (tab: string, action: string, data: any) => {
    const currentParams = new URLSearchParams(location.search);
    const projectId = currentParams.get('id');
    
    if (!projectId) {
      console.error('No project ID found in current URL');
      return '#';
    }

    const crossModuleData = {
      title: variation.title,
      description: variation.description,
      category: variation.category,
      trade: variation.trade,
      variationNumber: variation.variation_number,
      costImpact: variation.total_amount,
      timeImpact: variation.time_impact,
      fromVariation: true,
      ...data
    };

    const encodedData = encodeURIComponent(JSON.stringify(crossModuleData));
    return `/projects?id=${projectId}&tab=${tab}&action=${action}&data=${encodedData}`;
  };

  const handleProgrammeClick = () => {
    const url = createCrossModuleUrl('programme', 'create-milestone', {
      milestone_name: variation.title,
      category: variation.category,
      trade: variation.trade,
      reference_number: variation.variation_number
    });
    navigate(url);
  };

  const handleTaskClick = () => {
    const url = createCrossModuleUrl('tasks', 'create-task', {
      task_title: `Complete ${variation.title}`,
      task_description: variation.description,
      reference_number: variation.variation_number
    });
    navigate(url);
  };

  const handleRFIClick = () => {
    const url = createCrossModuleUrl('rfis', 'create-rfi', {
      rfi_title: `Query regarding ${variation.title}`,
      rfi_description: `RFI related to variation: ${variation.description}`,
      reference_number: variation.variation_number
    });
    navigate(url);
  };

  const handleFinanceClick = () => {
    const url = createCrossModuleUrl('finance', 'create-budget-item', {
      budget_description: variation.title,
      budgeted_cost: variation.total_amount,
      trade_category: variation.trade || variation.category,
      reference_number: variation.variation_number,
      originating_variation_id: variation.id
    });
    navigate(url);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Cross-Module Integration</h4>
          <Badge variant="outline" className="text-xs">
            Auto-populate from this variation
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto p-3"
            onClick={handleProgrammeClick}
          >
            <Calendar className="h-4 w-4 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Programme</div>
              <div className="text-xs text-gray-500">Create milestone</div>
            </div>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto p-3"
            onClick={handleTaskClick}
          >
            <CheckSquare className="h-4 w-4 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Tasks</div>
              <div className="text-xs text-gray-500">Create task</div>
            </div>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto p-3"
            onClick={handleRFIClick}
          >
            <MessageSquare className="h-4 w-4 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-sm">RFI</div>
              <div className="text-xs text-gray-500">Create query</div>
            </div>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>

          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto p-3"
            onClick={handleFinanceClick}
          >
            <Calculator className="h-4 w-4 text-orange-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Finance</div>
              <div className="text-xs text-gray-500">Create budget item</div>
            </div>
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Click any module to create linked items with pre-populated data from this variation
        </div>
      </CardContent>
    </Card>
  );
};

export default CrossModuleIntegrationBar;
