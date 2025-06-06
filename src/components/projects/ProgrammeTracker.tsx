
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ProgrammeTrackerProps {
  projectName: string;
}

const ProgrammeTracker: React.FC<ProgrammeTrackerProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    dueDate: '',
    linkedModule: '',
    priority: 'normal',
    assignedTo: '',
    description: ''
  });

  // Sample milestones data
  const milestones = [
    {
      id: 1,
      name: 'Foundation Completion',
      dueDate: '2024-02-15',
      status: 'complete',
      linkedModule: 'QA/ITP',
      priority: 'high',
      assignedTo: 'John Smith',
      daysOverdue: 0
    },
    {
      id: 2,
      name: 'Framing Complete',
      dueDate: '2024-03-01',
      status: 'in-progress',
      linkedModule: 'Material Handover',
      priority: 'high',
      assignedTo: 'Sarah Johnson',
      daysOverdue: 0
    },
    {
      id: 3,
      name: 'Roof Installation',
      dueDate: '2024-03-15',
      status: 'pending',
      linkedModule: 'Delivery Schedule',
      priority: 'normal',
      assignedTo: 'Mike Davis',
      daysOverdue: 0
    },
    {
      id: 4,
      name: 'Electrical First Fix',
      dueDate: '2024-01-20',
      status: 'overdue',
      linkedModule: 'RFI',
      priority: 'high',
      assignedTo: 'Lisa Wang',
      daysOverdue: 3
    }
  ];

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">✅ Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">🔄 In Progress</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">🔴 Overdue ({daysOverdue}d)</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Milestone:', newMilestone);
    
    toast({
      title: "Milestone Added",
      description: `${newMilestone.name} has been added to the programme.`,
    });

    setNewMilestone({
      name: '',
      dueDate: '',
      linkedModule: '',
      priority: 'normal',
      assignedTo: '',
      description: ''
    });
    setShowNewMilestone(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Programme Tracker</h3>
          <p className="text-gray-600">Track project milestones and delivery schedules</p>
        </div>
        <Button onClick={() => setShowNewMilestone(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Summary Cards */}
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
              {milestones.filter(m => m.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-gray-500 mb-2" />
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* New Milestone Form */}
      {showNewMilestone && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="milestoneName">Milestone Name</Label>
                  <Input
                    id="milestoneName"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Electrical Second Fix"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedModule">Linked Module</Label>
                  <Select value={newMilestone.linkedModule} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, linkedModule: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select linked module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qa-itp">QA/ITP</SelectItem>
                      <SelectItem value="material-handover">Material Handover</SelectItem>
                      <SelectItem value="delivery-schedule">Delivery Schedule</SelectItem>
                      <SelectItem value="variation">Variation</SelectItem>
                      <SelectItem value="rfi">RFI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newMilestone.priority} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Add Milestone</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewMilestone(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Milestones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Linked Module</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell className="font-medium">{milestone.name}</TableCell>
                  <TableCell>{milestone.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(milestone.status, milestone.daysOverdue)}</TableCell>
                  <TableCell>{getPriorityBadge(milestone.priority)}</TableCell>
                  <TableCell>{milestone.linkedModule}</TableCell>
                  <TableCell>{milestone.assignedTo}</TableCell>
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

export default ProgrammeTracker;
