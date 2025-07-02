import React from 'react';
import QAITPTrackerSimple from './QAITPTrackerSimple';

interface QAITPTrackerProps {
  onNewInspection: () => void;
  projectId: string;
}

const QAITPTracker: React.FC<QAITPTrackerProps> = ({ 
  onNewInspection, 
  projectId 
}) => {
  // Use the simplified, working version
  return <QAITPTrackerSimple onNewInspection={onNewInspection} projectId={projectId} />;
};

export default QAITPTracker;