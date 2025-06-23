import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, AlertTriangle, CheckCircle2, Clock, CalendarDays, Eye } from 'lucide-react';

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

  // Sample milestones data with more dates for outlook testing
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
    },
    // Additional milestones for outlook demonstration
    {
      id: 5,
      name: 'Plumbing Rough-in',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      status: 'pending',
      linkedModule: 'QA/ITP',
      priority: 'high',
      assignedTo: 'Tom Wilson',
      daysOverdue: 0
    },
    {
      id: 6,
      name: 'Insulation Installation',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      status: 'pending',
      linkedModule: 'Material Handover',
      priority: 'medium',
      assignedTo: 'Emma Brown',
      daysOverdue: 0
    },
    {
      id: 7,
      name: 'Drywall Installation',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
      status: 'pending',
      linkedModule: 'Delivery Schedule',
      priority: 'medium',
      assignedTo: 'Chris Green',
      daysOverdue: 0
    },
    {
      id: 8,
      name: 'Flooring Installation',
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days from now
      status: 'pending',
      linkedModule: 'Material Handover',
      priority: 'normal',
      assignedTo: 'Alex Turner',
      daysOverdue: 0
    }
  ];

  // Helper functions for date calculations
  const isWithinDays = (dateString: string, days: number) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return targetDate >= today && targetDate <= futureDate;
  };

  const getDaysUntil = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter milestones for different outlooks
  const oneWeekOutlook = milestones.filter(milestone => 
    milestone.status !== 'complete' && isWithinDays(milestone.dueDate, 7)
  );

  const threeWeekLookAhead = milestones.filter(milestone => 
    milestone.status !== 'complete' && isWithinDays(milestone.dueDate, 21)
  );

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

  const getDaysUntilBadge = (daysUntil: number) => {
    if (daysUntil < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntil === 0) {
      return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
    } else if (daysUntil === 1) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Tomorrow</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">{daysUntil} days</Badge>;
    } else {
      return <Badge variant="outline">{daysUntil} days</Badge>;
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Milestone:', newMilestone);
    
    toast({
      title: "Milestone Added",
      description: `${newMilestone.name} has been added to the programme.`,
    });

    // Reset form state
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

      {/* Programme Outlook Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="one-week" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            1 Week Outlook
          </TabsTrigger>
          <TabsTrigger value="three-week" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            3 Week Look Ahead
          </TabsTrigger>
          <TabsTrigger value="all">All Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  Next 7 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {oneWeekOutlook.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No milestones due in the next week</p>
                ) : (
                  <div className="space-y-2">
                    {oneWeekOutlook.slice(0, 3).map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{milestone.name}</div>
                          <div className="text-xs text-gray-600">{milestone.assignedTo}</div>
                        </div>
                        <div className="text-right">
                          {getDaysUntilBadge(getDaysUntil(milestone.dueDate))}
                        </div>
                      </div>
                    ))}
                    {oneWeekOutlook.length > 3 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-gray-500">+{oneWeekOutlook.length - 3} more</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-green-500" />
                  Next 3 Weeks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {threeWeekLookAhead.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No milestones due in the next 3 weeks</p>
                ) : (
                  <div className="space-y-2">
                    {threeWeekLookAhead.slice(0, 4).map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{milestone.name}</div>
                          <div className="text-xs text-gray-600">{milestone.assignedTo}</div>
                        </div>
                        <div className="text-right">
                          {getDaysUntilBadge(getDaysUntil(milestone.dueDate))}
                        </div>
                      </div>
                    ))}
                    {threeWeekLookAhead.length > 4 && (
                      <div className="text-center pt-2">
                        <span className="text-sm text-gray-500">+{threeWeekLookAhead.length - 4} more</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="one-week">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                1 Week Outlook ({oneWeekOutlook.length} milestones)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oneWeekOutlook.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No milestones due in the next 7 days</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oneWeekOutlook.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-medium">{milestone.name}</TableCell>
                        <TableCell>{milestone.dueDate}</TableCell>
                        <TableCell>{getDaysUntilBadge(getDaysUntil(milestone.dueDate))}</TableCell>
                        <TableCell>{getStatusBadge(milestone.status, milestone.daysOverdue)}</TableCell>
                        <TableCell>{getPriorityBadge(milestone.priority)}</TableCell>
                        <TableCell>{milestone.assignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="three-week">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                3 Week Look Ahead ({threeWeekLookAhead.length} milestones)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {threeWeekLookAhead.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No milestones due in the next 3 weeks</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Linked Module</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threeWeekLookAhead.map((milestone) => (
                      <TableRow key={milestone.id}>
                        <TableCell className="font-medium">{milestone.name}</TableCell>
                        <TableCell>{milestone.dueDate}</TableCell>
                        <TableCell>{getDaysUntilBadge(getDaysUntil(milestone.dueDate))}</TableCell>
                        <TableCell>{getStatusBadge(milestone.status, milestone.daysOverdue)}</TableCell>
                        <TableCell>{getPriorityBadge(milestone.priority)}</TableCell>
                        <TableCell>{milestone.linkedModule}</TableCell>
                        <TableCell>{milestone.assignedTo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          {/* New Milestone Form */}
          {showNewMilestone && (
            <Card className="mb-6">
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

          {/* All Milestones Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Project Milestones</CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgrammeTracker;
