import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, MessageSquare, Calculator, ArrowRight } from 'lucide-react';
import { useCrossModuleNavigation } from '@/hooks/useCrossModuleNavigation';

interface QACrossModuleIntegrationProps {
  inspection: any;
}

const QACrossModuleIntegration: React.FC<QACrossModuleIntegrationProps> = ({ inspection }) => {
  const {
    navigateToMilestoneCreation,
    navigateToTaskCreation,
    navigateToRFICreation,
    navigateToFinanceCreation,
    getCurrentProjectId
  } = useCrossModuleNavigation();

  const projectId = getCurrentProjectId();

  if (!projectId) {
    console.error('No project ID found in current URL');
    return null;
  }

  const handleProgrammeClick = () => {
    navigateToMilestoneCreation(projectId, {
      title: `QA Milestone - ${inspection.task_area}`,
      description: `Milestone linked to QA inspection ${inspection.inspection_number}`,
      location: inspection.location_reference,
      trade: inspection.template_type?.replace('-', ' '),
      category: 'qa_inspection'
    });
  };

  const handleTaskClick = () => {
    navigateToTaskCreation(projectId, {
      title: `QA Follow-up - ${inspection.task_area}`,
      description: `Task linked to QA inspection ${inspection.inspection_number}`,
      location: inspection.location_reference,
      priority: inspection.overall_status === 'fail' ? 'high' : 'medium'
    });
  };

  const handleRFIClick = () => {
    navigateToRFICreation(projectId, {
      title: `QA Query - ${inspection.task_area}`,
      description: `RFI linked to QA inspection ${inspection.inspection_number}`,
      location: inspection.location_reference,
      priority: inspection.overall_status === 'fail' ? 'high' : 'medium'
    });
  };

  const handleFinanceClick = () => {
    navigateToFinanceCreation(projectId, {
      title: `QA Budget Item - ${inspection.task_area}`,
      description: `Budget item linked to QA inspection ${inspection.inspection_number}`,
      location: inspection.location_reference,
      trade: inspection.template_type?.replace('-', ' '),
      category: 'qa_related'
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Cross-Module Integration</h4>
          <Badge variant="outline" className="text-xs">
            Auto-populate from QA inspection {inspection.inspection_number}
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
          Click any module to create linked items with pre-populated data from QA inspection {inspection.inspection_number}
        </div>
      </CardContent>
    </Card>
  );
};

export default QACrossModuleIntegration;