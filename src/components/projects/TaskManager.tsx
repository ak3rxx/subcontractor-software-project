
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle2, Clock, AlertTriangle, User, Calendar } from 'lucide-react';

interface TaskManagerProps {
  projectName: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newTask, setNewTask] = useState({
    name: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo',
    relatedModule: '',
    description: '',
    estimatedHours: ''
  });

  // Sample tasks data
  const tasks = [
    {
      id: 'TASK-001',
      name: 'Review electrical drawings',
      assignedTo: 'Sarah Johnson',
      dueDate: '2024-01-20',
      priority: 'high',
      status: 'in-progress',
      relatedModule: 'RFI',
      description: 'Review and approve electrical drawings for Level 3',
      createdDate: '2024-01-15'
    },
    {
      id: 'TASK-002',
      name: 'Schedule concrete delivery',
      assignedTo: 'Mike Davis',
      dueDate: '2024-01-18',
      priority: 'high',
      status: 'done',
      relatedModule: 'Delivery Schedule',
      description: 'Coordinate concrete delivery for foundation pour',
      createdDate: '2024-01-10'
    },
    {
      id: 'TASK-003',
      name: 'Update safety documentation',
      assignedTo: 'John Smith',
      dueDate: '2024-01-25',
      priority: 'medium',
      status: 'todo',
      relatedModule: 'Documents',
      description: 'Update SWMS for new work area',
      createdDate: '2024-01-16'
    },
    {
      id: 'TASK-004',
      name: 'Respond to client variation',
      assignedTo: 'Lisa Wang',
      dueDate: '2024-01-17',
      priority: 'high',
      status: 'blocked',
      relatedModule: 'Variation',
      description: 'Pending engineer approval for structural modification',
      createdDate: '2024-01-12'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-green-100 text-green-800">✅ Done</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">🔄 In Progress</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">🚫 Blocked</Badge>;
      case 'todo':
        return <Badge className="bg-gray-100 text-gray-800">📝 To Do</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'done') return false;
    return new Date(dueDate) < new Date();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Task:', newTask);
    
    toast({
      title: "Task Created",
      description: `${newTask.name} has been assigned to ${newTask.assignedTo}.`,
    });

    setNewTask({
      name: '',
      assignedTo: '',
      dueDate: '',
      priority: 'medium',
      status: 'todo',
      relatedModule: '',
      description: '',
      estimatedHours: ''
    });
    setShowNewTask(false);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'overdue') return isOverdue(task.dueDate, task.status);
    return task.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Task Manager</h3>
          <p className="text-gray-600">Track project tasks and action items</p>
        </div>
        <Button onClick={() => setShowNewTask(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'done').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">
              {tasks.filter(t => isOverdue(t.dueDate, t.status)).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'blocked').length}
            </div>
            <div className="text-sm text-gray-600">Blocked</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'todo').length}
            </div>
            <div className="text-sm text-gray-600">To Do</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Label>Filter:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="done">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* New Task Form */}
      {showNewTask && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taskName">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTask.name}
                    onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Brief task description"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="Mike Davis">Mike Davis</SelectItem>
                      <SelectItem value="John Smith">John Smith</SelectItem>
                      <SelectItem value="Lisa Wang">Lisa Wang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Task Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed task description including requirements and deliverables"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedModule">Related Module</Label>
                  <Select value={newTask.relatedModule} onValueChange={(value) => setNewTask(prev => ({ ...prev, relatedModule: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QA/ITP">QA/ITP</SelectItem>
                      <SelectItem value="Material Handover">Material Handover</SelectItem>
                      <SelectItem value="Delivery Schedule">Delivery Schedule</SelectItem>
                      <SelectItem value="Variation">Variation</SelectItem>
                      <SelectItem value="RFI">RFI</SelectItem>
                      <SelectItem value="Documents">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Create Task</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewTask(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Action Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Related Module</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className={isOverdue(task.dueDate, task.status) ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium max-w-[250px]">
                    <div>
                      <div className="truncate">{task.name}</div>
                      {isOverdue(task.dueDate, task.status) && (
                        <div className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{task.assignedTo}</TableCell>
                  <TableCell>{task.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{task.relatedModule}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;
