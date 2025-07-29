import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskNavigationBreadcrumbProps {
  projectId?: string;
  projectName?: string;
  linkedModule?: string;
  showGlobalTasksLink?: boolean;
}

export const TaskNavigationBreadcrumb: React.FC<TaskNavigationBreadcrumbProps> = ({
  projectId,
  projectName,
  linkedModule,
  showGlobalTasksLink = true,
}) => {
  const navigate = useNavigate();

  const getModuleDisplayName = (module: string) => {
    const moduleNames = {
      'qa': 'QA/ITP',
      'variation': 'Variations',
      'rfi': 'RFIs',
      'delivery': 'Deliveries',
      'milestone': 'Programme',
      'finance': 'Finance',
    };
    return moduleNames[module as keyof typeof moduleNames] || module;
  };

  const handleGlobalTasksNavigation = () => {
    navigate('/tasks');
  };

  const handleProjectTasksNavigation = () => {
    if (projectId) {
      navigate(`/projects?id=${projectId}&tab=tasks`);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b">
      <div className="flex items-center gap-2 text-sm">
        {showGlobalTasksLink && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGlobalTasksNavigation}
              className="h-auto p-1 text-primary hover:text-primary/80"
            >
              All Tasks
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}
        
        {projectName && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProjectTasksNavigation}
              className="h-auto p-1 text-primary hover:text-primary/80"
            >
              {projectName}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}
        
        {linkedModule && (
          <>
            <Badge variant="secondary" className="text-xs">
              {getModuleDisplayName(linkedModule)}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </>
        )}
        
        <span className="text-muted-foreground">Tasks</span>
      </div>

      {projectId && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects?id=${projectId}`)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
        </div>
      )}
    </div>
  );
};