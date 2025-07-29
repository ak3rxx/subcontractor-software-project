import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus,
  Filter,
  Search,
  MapPin,
  Users,
  TrendingUp,
  Bell
} from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface MobileProgrammeViewProps {
  milestones: ProgrammeMilestone[];
  onMilestoneUpdate?: (id: string, updates: Partial<ProgrammeMilestone>) => void;
  onAddMilestone?: () => void;
  projectId?: string;
}

export const MobileProgrammeView: React.FC<MobileProgrammeViewProps> = ({
  milestones,
  onMilestoneUpdate,
  onAddMilestone,
  projectId
}) => {
  const [activeTab, setActiveTab] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrade, setFilterTrade] = useState('all');

  // Mobile-optimized data processing
  const processedData = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const nextWeek = addDays(now, 7);

    const today = milestones.filter(m => {
      if (!m.planned_date) return false;
      const planned = new Date(m.planned_date);
      return planned.toDateString() === now.toDateString();
    });

    const upcoming = milestones.filter(m => {
      if (!m.planned_date || m.status === 'complete') return false;
      const planned = new Date(m.planned_date);
      return isAfter(planned, tomorrow) && isBefore(planned, nextWeek);
    });

    const overdue = milestones.filter(m => {
      if (!m.planned_date || m.status === 'complete') return false;
      const planned = new Date(m.planned_date);
      return isBefore(planned, now);
    });

    const critical = milestones.filter(m => 
      m.critical_path || m.priority === 'high' || m.status === 'delayed'
    );

    return { today, upcoming, overdue, critical };
  }, [milestones]);

  // Filter milestones based on search and trade filter
  const filteredMilestones = useMemo(() => {
    let filtered = milestones;

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.milestone_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.trade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTrade !== 'all') {
      filtered = filtered.filter(m => m.trade === filterTrade);
    }

    return filtered;
  }, [milestones, searchTerm, filterTrade]);

  // Get unique trades for filter
  const trades = useMemo(() => {
    const uniqueTrades = [...new Set(milestones.map(m => m.trade).filter(Boolean))];
    return uniqueTrades.sort();
  }, [milestones]);

  const getMilestoneStatusColor = (milestone: ProgrammeMilestone) => {
    if (milestone.status === 'complete') return 'bg-green-500';
    if (milestone.status === 'delayed') return 'bg-red-500';
    if (milestone.priority === 'high') return 'bg-orange-500';
    if (milestone.critical_path) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  const handleQuickUpdate = async (milestone: ProgrammeMilestone, status: 'upcoming' | 'in-progress' | 'complete' | 'delayed') => {
    if (onMilestoneUpdate) {
      await onMilestoneUpdate(milestone.id, { status });
    }
  };

  const MilestoneCard: React.FC<{ milestone: ProgrammeMilestone; compact?: boolean }> = ({ milestone, compact = false }) => (
    <Card className={`border-l-4 ${compact ? 'mb-2' : 'mb-4'}`} style={{ borderLeftColor: getMilestoneStatusColor(milestone) }}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
                {milestone.milestone_name}
              </h4>
              {milestone.description && !compact && (
                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
              )}
            </div>
            <Badge 
              variant={milestone.status === 'complete' ? 'default' : 'secondary'}
              className="ml-2"
            >
              {milestone.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            {milestone.planned_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(milestone.planned_date), 'MMM d')}
              </div>
            )}
            {milestone.trade && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {milestone.trade}
              </div>
            )}
          </div>

          {milestone.critical_path && (
            <Badge variant="destructive" className="text-xs">
              Critical Path
            </Badge>
          )}

          {!compact && milestone.status !== 'complete' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickUpdate(milestone, 'in-progress')}
                disabled={milestone.status === 'in-progress'}
                className="text-xs"
              >
                Start
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleQuickUpdate(milestone, 'complete')}
                className="text-xs"
              >
                Complete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const QuickStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="text-center">
        <CardContent className="p-3">
          <div className="text-lg font-bold text-blue-600">{processedData.today.length}</div>
          <div className="text-xs text-gray-600">Due Today</div>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent className="p-3">
          <div className="text-lg font-bold text-orange-600">{processedData.upcoming.length}</div>
          <div className="text-xs text-gray-600">This Week</div>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent className="p-3">
          <div className="text-lg font-bold text-red-600">{processedData.overdue.length}</div>
          <div className="text-xs text-gray-600">Overdue</div>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent className="p-3">
          <div className="text-lg font-bold text-purple-600">{processedData.critical.length}</div>
          <div className="text-xs text-gray-600">Critical</div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 pb-20"> {/* Bottom padding for mobile navigation */}
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white z-10 pb-2 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Programme Mobile</h2>
          {onAddMilestone && (
            <Button size="sm" onClick={onAddMilestone} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          )}
        </div>

        {/* Quick Search and Filter */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
          <select
            value={filterTrade}
            onChange={(e) => setFilterTrade(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All Trades</option>
            {trades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        <QuickStats />
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
          <TabsTrigger value="week" className="text-xs">Week</TabsTrigger>
          <TabsTrigger value="critical" className="text-xs">Critical</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2">
          {processedData.today.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-600">No milestones due today</p>
              </CardContent>
            </Card>
          ) : (
            processedData.today.map(milestone => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))
          )}

          {processedData.overdue.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h3 className="font-semibold text-red-700">Overdue Items</h3>
              </div>
              {processedData.overdue.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-2">
          {processedData.upcoming.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No milestones due this week</p>
              </CardContent>
            </Card>
          ) : (
            processedData.upcoming.map(milestone => (
              <MilestoneCard key={milestone.id} milestone={milestone} compact />
            ))
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-2">
          {processedData.critical.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-600">No critical issues</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {processedData.critical.length} critical milestone{processedData.critical.length > 1 ? 's' : ''} require attention
                </AlertDescription>
              </Alert>
              {processedData.critical.map(milestone => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-2">
          {filteredMilestones.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No milestones match your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredMilestones.map(milestone => (
              <MilestoneCard key={milestone.id} milestone={milestone} compact />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Notification Alert */}
      {(processedData.overdue.length > 0 || processedData.critical.length > 0) && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <Alert className="bg-red-50 border-red-200">
            <Bell className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {processedData.overdue.length} overdue, {processedData.critical.length} critical items need attention
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};