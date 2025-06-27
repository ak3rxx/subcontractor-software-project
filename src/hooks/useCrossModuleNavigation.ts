
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface CrossModuleData {
  title?: string;
  description?: string;
  category?: string;
  trade?: string;
  variationNumber?: string;
  costImpact?: number;
  timeImpact?: number;
  fromVariation?: boolean;
  milestone_name?: string;
  reference_number?: string;
  task_title?: string;
  task_description?: string;
  rfi_title?: string;
  rfi_description?: string;
  budget_description?: string;
  budgeted_cost?: number;
  trade_category?: string;
  originating_variation_id?: string;
}

export const useCrossModuleNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const createCrossModuleUrl = (
    projectId: string,
    tab: string,
    action: string,
    data: CrossModuleData
  ) => {
    const encodedData = encodeURIComponent(JSON.stringify(data));
    return `/projects?id=${projectId}&tab=${tab}&action=${action}&data=${encodedData}`;
  };

  const navigateToMilestoneCreation = (projectId: string, variationData: any) => {
    const crossModuleData: CrossModuleData = {
      milestone_name: variationData.title,
      description: variationData.description,
      category: variationData.category,
      trade: variationData.trade,
      reference_number: variationData.variation_number,
      fromVariation: true,
      title: variationData.title,
      variationNumber: variationData.variation_number,
      costImpact: variationData.total_amount,
      timeImpact: variationData.time_impact
    };

    const url = createCrossModuleUrl(projectId, 'programme', 'create-milestone', crossModuleData);
    navigate(url);

    toast({
      title: "Cross-Module Integration",
      description: `Data from variation ${variationData.variation_number} has been pre-filled`,
    });
  };

  const navigateToTaskCreation = (projectId: string, variationData: any) => {
    const crossModuleData: CrossModuleData = {
      task_title: `Complete ${variationData.title}`,
      task_description: variationData.description,
      reference_number: variationData.variation_number,
      fromVariation: true,
      title: variationData.title,
      description: variationData.description,
      category: variationData.category,
      trade: variationData.trade,
      variationNumber: variationData.variation_number
    };

    const url = createCrossModuleUrl(projectId, 'tasks', 'create-task', crossModuleData);
    navigate(url);

    toast({
      title: "Cross-Module Integration",
      description: `Task template from variation ${variationData.variation_number} is ready`,
    });
  };

  const navigateToRFICreation = (projectId: string, variationData: any) => {
    const crossModuleData: CrossModuleData = {
      rfi_title: `Query regarding ${variationData.title}`,
      rfi_description: `RFI related to variation: ${variationData.description}`,
      reference_number: variationData.variation_number,
      fromVariation: true,
      title: variationData.title,
      description: variationData.description,
      category: variationData.category,
      trade: variationData.trade,
      variationNumber: variationData.variation_number
    };

    const url = createCrossModuleUrl(projectId, 'rfis', 'create-rfi', crossModuleData);
    navigate(url);

    toast({
      title: "Cross-Module Integration",
      description: `RFI template from variation ${variationData.variation_number} is ready`,
    });
  };

  const navigateToFinanceCreation = (projectId: string, variationData: any) => {
    const crossModuleData: CrossModuleData = {
      budget_description: variationData.title,
      budgeted_cost: variationData.total_amount,
      trade_category: variationData.trade || variationData.category,
      reference_number: variationData.variation_number,
      originating_variation_id: variationData.id,
      fromVariation: true,
      title: variationData.title,
      description: variationData.description,
      variationNumber: variationData.variation_number
    };

    const url = createCrossModuleUrl(projectId, 'finance', 'create-budget-item', crossModuleData);
    navigate(url);

    toast({
      title: "Cross-Module Integration",
      description: `Budget item from variation ${variationData.variation_number} is ready`,
    });
  };

  const getCurrentProjectId = (): string | null => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('id');
  };

  const getCrossModuleData = (): CrossModuleData | null => {
    const searchParams = new URLSearchParams(location.search);
    const data = searchParams.get('data');
    
    if (!data) return null;
    
    try {
      return JSON.parse(decodeURIComponent(data));
    } catch (error) {
      console.error('Error parsing cross-module data:', error);
      return null;
    }
  };

  const getCrossModuleAction = (): string | null => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('action');
  };

  return {
    navigateToMilestoneCreation,
    navigateToTaskCreation,
    navigateToRFICreation,
    navigateToFinanceCreation,
    getCurrentProjectId,
    getCrossModuleData,
    getCrossModuleAction,
    createCrossModuleUrl
  };
};
