import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, FileText, MessageSquare, CheckSquare, Calculator, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Task } from '@/hooks/useTasks';

interface TaskLinkedBadgeProps {
  task: Task;
  showNavigateButton?: boolean;
}

export const TaskLinkedBadge: React.FC<TaskLinkedBadgeProps> = ({ 
  task, 
  showNavigateButton = false 
}) => {
  const navigate = useNavigate();

  if (!task.linked_module || !task.linked_id) {
    return null;
  }

  const getModuleInfo = () => {
    switch (task.linked_module) {
      case 'variation':
        return {
          icon: FileText,
          label: 'VAR',
          color: 'bg-blue-100 text-blue-800',
          path: `/projects?id=${task.project_id}&tab=variations`
        };
      case 'rfi':
        return {
          icon: MessageSquare,
          label: 'RFI',
          color: 'bg-purple-100 text-purple-800',
          path: `/projects?id=${task.project_id}&tab=rfis`
        };
      case 'qa':
        return {
          icon: CheckSquare,
          label: 'QA',
          color: 'bg-green-100 text-green-800',
          path: `/projects?id=${task.project_id}&tab=qa`
        };
      case 'finance':
        return {
          icon: Calculator,
          label: 'FIN',
          color: 'bg-orange-100 text-orange-800',
          path: `/projects?id=${task.project_id}&tab=finance`
        };
      default:
        return {
          icon: Link2,
          label: 'LINK',
          color: 'bg-gray-100 text-gray-800',
          path: `/projects?id=${task.project_id}`
        };
    }
  };

  const moduleInfo = getModuleInfo();
  const IconComponent = moduleInfo.icon;

  const handleNavigate = () => {
    if (task.project_id) {
      navigate(moduleInfo.path);
    }
  };

  const getBadgeText = () => {
    // If we have a task_number or reference_number that contains the linked info, use it
    if (task.task_number && task.task_number.includes(moduleInfo.label)) {
      return task.task_number;
    }
    
    // Otherwise, create a generic reference
    return `${moduleInfo.label}-${task.linked_id?.slice(0, 8)}`;
  };

  if (showNavigateButton) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${moduleInfo.color} flex items-center gap-1 text-xs`}>
          <IconComponent className="h-3 w-3" />
          {getBadgeText()}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigate}
          className="h-6 px-2 text-xs"
          title={`Navigate to ${task.linked_module}`}
        >
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge 
      className={`${moduleInfo.color} flex items-center gap-1 text-xs cursor-pointer hover:opacity-80`}
      onClick={handleNavigate}
      title={`Navigate to ${task.linked_module}`}
    >
      <IconComponent className="h-3 w-3" />
      {getBadgeText()}
    </Badge>
  );
};
