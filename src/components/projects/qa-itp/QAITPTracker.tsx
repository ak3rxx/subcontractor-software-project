
import React from 'react';
import QATrackerEnhanced from './QATrackerEnhanced';

interface QAITPTrackerProps {
  onNewInspection: () => void;
  projectId: string;
}

const QAITPTracker: React.FC<QAITPTrackerProps> = ({ onNewInspection, projectId }) => {
  return (
    <QATrackerEnhanced
      onNewInspection={onNewInspection}
      projectId={projectId}
    />
  );
};

export default QAITPTracker;
