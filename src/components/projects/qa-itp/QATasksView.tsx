import React from 'react';
import { EnhancedTaskManager } from '@/components/tasks/EnhancedTaskManager';

interface QATasksViewProps {
  projectId: string;
  projectName: string;
}

export const QATasksView: React.FC<QATasksViewProps> = ({ projectId, projectName }) => {
  return (
    <EnhancedTaskManager
      projectId={projectId}
      projectName={projectName}
      linkedModule="qa"
      showProjectFilter={false}
      title="QA Action Tasks"
    />
  );
};