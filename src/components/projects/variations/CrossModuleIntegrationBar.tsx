
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  CheckSquare, 
  HelpCircle, 
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Variation } from '@/hooks/useVariations';

interface CrossModuleIntegrationBarProps {
  variation: Variation;
  projectId: string;
  onClose: () => void;
}

const CrossModuleIntegrationBar: React.FC<CrossModuleIntegrationBarProps> = ({
  variation,
  projectId,
  onClose
}) => {
  const navigate = useNavigate();

  const handleProgrammeIntegration = () => {
    // Navigate to Programme module with pre-filled milestone data
    const milestoneData = {
      fromVariation: true,
      variationId: variation.id,
      variationNumber: variation.variation_number,
      milestoneName: `${variation.title} - Implementation`,
      timeImpact: variation.time_impact,
      costImpact: variation.total_amount,
      priority: variation.priority,
      description: `Milestone created from variation ${variation.variation_number}: ${variation.description}`
    };
    
    const queryParams = new URLSearchParams({
      tab: 'programme',
      action: 'create_milestone',
      data: JSON.stringify(milestoneData)
    }).toString();
    
    onClose();
    navigate(`/projects?id=${projectId}&${queryParams}`);
  };

  const handleTaskIntegration = () => {
    // Navigate to Task module with pre-filled task data
    const taskData = {
      fromVariation: true,
      variationId: variation.id,
      variationNumber: variation.variation_number,
      title: `${variation.title} - Implementation Tasks`,
      description: `Tasks required for variation ${variation.variation_number}:\n\n${variation.description}`,
      priority: variation.priority,
      category: variation.category || 'variation_implementation',
      dueDate: variation.requires_eot ? 
        new Date(Date.now() + (variation.eot_days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] :
        new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    };
    
    const queryParams = new URLSearchParams({
      tab: 'tasks',
      action: 'create_task',
      data: JSON.stringify(taskData)
    }).toString();
    
    onClose();
    navigate(`/projects?id=${projectId}&${queryParams}`);
  };

  const handleRFIIntegration = () => {
    if (variation.originating_rfi_id) {
      // Navigate to existing RFI
      const queryParams = new URLSearchParams({
        tab: 'rfis',
        action: 'view_rfi',
        rfiId: variation.originating_rfi_id
      }).toString();
      
      onClose();
      navigate(`/projects?id=${projectId}&${queryParams}`);
    } else {
      // Create new RFI for clarifications
      const rfiData = {
        fromVariation: true,
        variationId: variation.id,
        variationNumber: variation.variation_number,
        title: `Clarification Required - ${variation.title}`,
        description: `RFI created from variation ${variation.variation_number}:\n\nRequesting clarification on: ${variation.description}`,
        priority: variation.priority === 'high' ? 'high' : 'medium',
        category: variation.category || 'variation_clarification'
      };
      
      const queryParams = new URLSearchParams({
        tab: 'rfis',
        action: 'create_rfi',
        data: JSON.stringify(rfiData)
      }).toString();
      
      onClose();
      navigate(`/projects?id=${projectId}&${queryParams}`);
    }
  };

  const handleFinanceIntegration = () => {
    // Navigate to Finance module with variation impact data
    const financeData = {
      fromVariation: true,
      variationId: variation.id,
      variationNumber: variation.variation_number,
      costImpact: variation.total_amount,
      gstAmount: variation.gst_amount,
      costBreakdown: variation.cost_breakdown,
      budgetImpact: variation.status === 'approved' ? variation.total_amount : 0,
      description: `Financial impact from variation ${variation.variation_number}`,
      category: variation.category || 'variation_impact',
      status: variation.status
    };
    
    const queryParams = new URLSearchParams({
      tab: 'finance',
      action: 'variation_impact',
      data: JSON.stringify(financeData)
    }).toString();
    
    onClose();
    navigate(`/projects?id=${projectId}&${queryParams}`);
  };

  return (
    <div className="border-t bg-gray-50 p-4 sticky bottom-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ArrowRight className="h-4 w-4" />
          <span className="font-medium">Quick Actions:</span>
          <span>Create related items in other modules</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProgrammeIntegration}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Programme
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTaskIntegration}
            className="flex items-center gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Tasks
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRFIIntegration}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {variation.originating_rfi_id ? 'View RFI' : 'Create RFI'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinanceIntegration}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Finances
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrossModuleIntegrationBar;
