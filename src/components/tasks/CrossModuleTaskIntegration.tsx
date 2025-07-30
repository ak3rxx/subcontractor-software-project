import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Zap,
  Network
} from 'lucide-react';
import { useUnifiedIntelligence } from '@/hooks/useUnifiedIntelligence';
import { useDataCoordination } from '@/hooks/useDataCoordination';
import { useSimpleWorkflowAutomation } from '@/hooks/useSimpleWorkflowAutomation';

interface CrossModuleTaskIntegrationProps {
  projectId: string;
  taskId?: string;
  onNavigate?: (module: string, itemId: string) => void;
}

export const CrossModuleTaskIntegration: React.FC<CrossModuleTaskIntegrationProps> = ({
  projectId,
  taskId,
  onNavigate
}) => {
  const { 
    data, 
    crossModuleConnections, 
    syncCrossModuleUpdates,
    healthMetrics 
  } = useUnifiedIntelligence(projectId);
  const { emitDataEvent } = useDataCoordination();
  const { triggerTaskCompleted } = useSimpleWorkflowAutomation(projectId);
  const [updating, setUpdating] = useState(false);

  // Find connections for current task
  const taskConnections = taskId ? {
    milestones: crossModuleConnections.taskToMilestone.filter(conn => conn.taskId === taskId),
    relatedTasks: data?.tasks.filter(t => 
      t.id !== taskId && 
      (t.linked_module === 'tasks' && t.linked_id === taskId)
    ) || []
  } : { milestones: [], relatedTasks: [] };

  // Auto-sync task completion with milestones
  const handleTaskCompletion = async (completedTaskId: string) => {
    if (!data) return;

    setUpdating(true);
    try {
      await syncCrossModuleUpdates('task', completedTaskId, { status: 'completed' });
      
      // Trigger workflow automation
      const task = data.tasks.find(t => t.id === completedTaskId);
      if (task) {
        triggerTaskCompleted(task, task.created_by || '');
      }
      
      // Emit data event for other components
      emitDataEvent({
        type: 'project-updated',
        payload: { 
          projectId, 
          taskId: completedTaskId,
          action: 'task_completed',
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error syncing task completion:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Calculate task impact on project health
  const getTaskImpact = () => {
    if (!data || !taskId) return null;

    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
    const isLinkedToMilestone = taskConnections.milestones.length > 0;
    const impactLevel = isLinkedToMilestone && isOverdue ? 'high' : 
                       isLinkedToMilestone ? 'medium' : 'low';

    return {
      task,
      isOverdue,
      isLinkedToMilestone,
      impactLevel,
      connectedMilestones: taskConnections.milestones.map(conn => {
        const milestone = data.milestones.find(m => m.id === conn.milestoneId);
        return { ...conn, milestone };
      })
    };
  };

  const taskImpact = getTaskImpact();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Cross-Module Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading integration data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Task Impact Analysis */}
      {taskImpact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Task Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Impact Level</span>
              <Badge 
                variant={
                  taskImpact.impactLevel === 'high' ? 'destructive' : 
                  taskImpact.impactLevel === 'medium' ? 'secondary' : 'outline'
                }
              >
                {taskImpact.impactLevel.toUpperCase()}
              </Badge>
            </div>

            {taskImpact.isOverdue && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Task is overdue - may impact project schedule</span>
              </div>
            )}

            {taskImpact.isLinkedToMilestone && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Connected Milestones:</p>
                {taskImpact.connectedMilestones.map((conn) => (
                  <div key={conn.milestoneId} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{conn.milestone?.milestone_name}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigate?.('programme', conn.milestoneId)}
                    >
                      View Milestone
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {taskImpact.task.status !== 'completed' && taskImpact.isLinkedToMilestone && (
              <Button 
                onClick={() => handleTaskCompletion(taskImpact.task.id)}
                disabled={updating}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Mark Complete & Sync Milestones'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Health Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Project Health Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Overall Health Score</p>
              <div className="text-2xl font-bold">{healthMetrics.healthScore}%</div>
              <Progress value={healthMetrics.healthScore} className="mt-2" />
            </div>
            <div>
              <p className="text-sm font-medium">Completion Probability</p>
              <div className="text-2xl font-bold">{healthMetrics.completionProbability}%</div>
              <Progress value={healthMetrics.completionProbability} className="mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Task Completion Impact:</p>
            <div className="text-sm text-muted-foreground">
              Completing this task will improve:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Overall project health score</li>
                {taskConnections.milestones.length > 0 && (
                  <li>Connected milestone progress ({taskConnections.milestones.length} milestone{taskConnections.milestones.length > 1 ? 's' : ''})</li>
                )}
                <li>Schedule adherence metrics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate?.('programme', '')}
            >
              View Programme
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate?.('variations', '')}
            >
              View Variations
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate?.('qa', '')}
            >
              View QA
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate?.('analytics', '')}
            >
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Module Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Module Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Milestones</span>
              <span className="font-medium">
                {data.milestones.filter(m => m.status === 'in-progress').length}/{data.milestones.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending Variations</span>
              <span className="font-medium">
                {data.variations.filter(v => v.status === 'pending_approval').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Failed QA Inspections</span>
              <span className="font-medium">
                {data.qaInspections.filter(qa => qa.overall_status === 'failed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Open RFIs</span>
              <span className="font-medium">
                {data.rfis.filter(rfi => rfi.status === 'open').length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};