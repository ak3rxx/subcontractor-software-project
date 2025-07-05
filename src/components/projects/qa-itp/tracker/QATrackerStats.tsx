import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatsCard = memo<StatsCardProps>(({ title, value, icon, color }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${color}`}>{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="text-lg">{icon}</div>
      </div>
    </CardContent>
  </Card>
));

interface QATrackerStatsProps {
  statusCounts: Record<string, number>;
}

const QATrackerStats: React.FC<QATrackerStatsProps> = ({ statusCounts }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatsCard title="Total" value={statusCounts.total || 0} icon="📊" color="text-muted-foreground" />
      <StatsCard title="Passed" value={statusCounts.pass || 0} icon="✅" color="text-green-600" />
      <StatsCard title="Failed" value={statusCounts.fail || 0} icon="❌" color="text-red-600" />
      <StatsCard title="Pending" value={statusCounts['pending-reinspection'] || 0} icon="🔄" color="text-orange-600" />
      <StatsCard title="In Progress" value={statusCounts['incomplete-in-progress'] || 0} icon="⏳" color="text-yellow-600" />
    </div>
  );
};

export default QATrackerStats;