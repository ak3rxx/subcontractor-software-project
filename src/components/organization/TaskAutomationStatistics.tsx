import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TaskAutomationStatisticsProps {
  organizationId?: string;
}

interface TaskStats {
  total_created: number;
  completed: number;
  overdue: number;
  created_this_week: number;
  created_last_week: number;
  completion_rate: number;
  category_breakdown: Record<string, number>;
}

const TaskAutomationStatistics: React.FC<TaskAutomationStatisticsProps> = ({ 
  organizationId 
}) => {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      // Get date ranges
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      // Query auto-created tasks (those with linked modules)
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id,
          status,
          category,
          due_date,
          created_at,
          completed_date,
          projects!inner(organization_id)
        `)
        .eq('projects.organization_id', organizationId)
        .not('linked_module', 'is', null);

      if (!tasks) {
        setStats({
          total_created: 0,
          completed: 0,
          overdue: 0,
          created_this_week: 0,
          created_last_week: 0,
          completion_rate: 0,
          category_breakdown: {}
        });
        return;
      }

      // Calculate statistics
      const totalCreated = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      
      const today = new Date().toISOString().split('T')[0];
      const overdue = tasks.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        t.due_date < today
      ).length;

      const createdThisWeek = tasks.filter(t => 
        new Date(t.created_at) >= oneWeekAgo
      ).length;
      
      const createdLastWeek = tasks.filter(t => 
        new Date(t.created_at) >= twoWeeksAgo && 
        new Date(t.created_at) < oneWeekAgo
      ).length;

      const completionRate = totalCreated > 0 ? (completed / totalCreated) * 100 : 0;

      // Category breakdown
      const categoryBreakdown = tasks.reduce((acc, task) => {
        const category = task.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({
        total_created: totalCreated,
        completed,
        overdue,
        created_this_week: createdThisWeek,
        created_last_week: createdLastWeek,
        completion_rate: Math.round(completionRate),
        category_breakdown: categoryBreakdown
      });

    } catch (error) {
      console.error('Error fetching task statistics:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [organizationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Task Statistics</CardTitle>
          <CardDescription>Overview of automated task creation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading statistics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Task Statistics</CardTitle>
          <CardDescription>Overview of automated task creation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Unable to load statistics</p>
            <Button 
              variant="outline" 
              onClick={fetchStatistics}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weeklyTrend = stats.created_this_week - stats.created_last_week;
  const weeklyTrendPercent = stats.created_last_week > 0 
    ? Math.round((weeklyTrend / stats.created_last_week) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Task Statistics</CardTitle>
        <CardDescription>
          Overview of automated task creation activity for your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {stats.created_this_week}
            </div>
            <div className="text-sm text-muted-foreground">
              Created This Week
            </div>
            {weeklyTrend !== 0 && (
              <div className="flex items-center justify-center mt-2">
                {weeklyTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-xs ${
                  weeklyTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(weeklyTrendPercent)}%
                </span>
              </div>
            )}
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-muted-foreground">
              Tasks Completed
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.completion_rate}% rate
              </Badge>
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.overdue}
            </div>
            <div className="text-sm text-muted-foreground">
              Tasks Overdue
            </div>
            <div className="mt-2">
              <Clock className="h-4 w-4 text-orange-600 mx-auto" />
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total_created}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Auto-Created
            </div>
            <div className="mt-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mx-auto" />
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(stats.category_breakdown).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Task Categories</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(stats.category_breakdown).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium capitalize">
                    {category}
                  </span>
                  <Badge variant="outline">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Performance insights */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span>
                {stats.completion_rate}% of auto-created tasks are completed
              </span>
            </div>
            {stats.overdue > 0 && (
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                <span>
                  {stats.overdue} tasks need attention
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStatistics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskAutomationStatistics;