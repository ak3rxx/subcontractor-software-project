
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';

interface MilestoneSummaryCardsProps {
  milestones: ProgrammeMilestone[];
}

const MilestoneSummaryCards: React.FC<MilestoneSummaryCardsProps> = ({ milestones }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
          <div className="text-2xl font-bold">
            {milestones.filter(m => m.status === 'complete').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
          <div className="text-2xl font-bold">
            {milestones.filter(m => m.status === 'in-progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <div className="text-2xl font-bold">
            {milestones.filter(m => m.status === 'delayed').length}
          </div>
          <div className="text-sm text-gray-600">Delayed</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 mx-auto text-gray-500 mb-2" />
          <div className="text-2xl font-bold">
            {milestones.filter(m => m.status === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestoneSummaryCards;
