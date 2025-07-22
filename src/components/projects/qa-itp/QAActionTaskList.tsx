
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertTriangle, Plus } from 'lucide-react';

interface QAActionTaskListProps {
  projectId: string;
}

const QAActionTaskList: React.FC<QAActionTaskListProps> = ({ projectId }) => {
  // Mock data for now - in real implementation, this would fetch from Supabase
  const actionTasks = [
    {
      id: '1',
      title: 'Review failed QA inspection - Kitchen Tiles',
      type: 'qa_follow_up',
      priority: 'high',
      dueDate: '2024-01-25',
      status: 'pending',
      assignedTo: 'Site Supervisor',
      description: 'Kitchen tiling failed inspection due to grout issues'
    },
    {
      id: '2',
      title: 'Complete ITP for Electrical Rough-in',
      type: 'itp_required',
      priority: 'medium',
      dueDate: '2024-01-28',
      status: 'in_progress',
      assignedTo: 'Electrical Contractor',
      description: 'ITP required before wall lining can commence'
    },
    {
      id: '3',
      title: 'Rectification Work - Waterproofing',
      type: 'rectification',
      priority: 'high',
      dueDate: '2024-01-24',
      status: 'overdue',
      assignedTo: 'Waterproofing Contractor',
      description: 'Membrane repair required in wet areas'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qa_follow_up': return <AlertTriangle className="h-4 w-4" />;
      case 'itp_required': return <CheckSquare className="h-4 w-4" />;
      case 'rectification': return <Clock className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Action & Task List</h2>
          <p className="text-muted-foreground">QA-related tasks and follow-up actions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">1</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">1</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">1</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {actionTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getTypeIcon(task.type)}
                  <div>
                    <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getPriorityColor(task.priority) as any}>
                    {task.priority}
                  </Badge>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Assigned to: {task.assignedTo}</span>
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm">
                    Update Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {actionTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Action Items</h3>
            <p className="text-muted-foreground">All QA tasks are up to date!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAActionTaskList;
