import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Wifi } from 'lucide-react';

interface QATrackerHeaderProps {
  onNewInspection: () => void;
}

const QATrackerHeader: React.FC<QATrackerHeaderProps> = ({ onNewInspection }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">QA/ITP Tracker</h2>
        <p className="text-muted-foreground">
          Manage quality assurance inspections and test plans
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3 w-3 text-green-500" />
          <span>Live</span>
        </div>
        <Button onClick={onNewInspection} data-tour="new-inspection-btn">
          <Plus className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </div>
    </div>
  );
};

export default QATrackerHeader;