
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckSquare, Plus, Calendar, User, Building2, Filter, Search, Clock, AlertCircle } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { useAuth } from '@/contexts/AuthContext';

const Tasks = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with real data from Supabase
  const tasks = [
    {
      id: '1',
      title: 'Review foundation inspection photos',
      description: 'Review and approve QA photos for foundation work',
      project: 'Riverside Apartments',
      assignee: user?.email,
      priority: 'high',
      status: 'in-progress',
      dueDate: '2024-12-22',
      createdAt: '2024-12-20',
      module: 'QA/ITP'
    },
    {
      id: '2',
      title: 'Update project budget variations',
      description: 'Input approved variations into finance module',
      project: 'Commercial Plaza',
      assignee: user?.email,
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-12-25',
      createdAt: '2024-12-19',
      module: 'Finance'
    },
    {
      id: '3',
      title: 'Upload electrical compliance certificates',
      description: 'Upload and organize electrical certificates in document manager',
      project: 'City Hospital Wing',
      assignee: 'sarah@company.com',
      priority: 'high',
      status: 'completed',
      dueDate: '2024-12-20',
      createdAt: '2024-12-18',
      module: 'Documents'
    },
    {
      id: '4',
      title: 'Schedule material delivery',
      description: 'Coordinate delivery of steel materials for next phase',
      project: 'Riverside Apartments',
      assignee: user?.email,
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-12-23',
      createdAt: '2024-12-20',
      module: 'Programme'
    }
  ];

  const myTasks = tasks.filter(task => task.assignee === user?.email);
  const allTasks = tasks;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">✓ Completed</Badge>;
      case 'in-progress': return <Badge className="bg-blue-100 text-blue-800">⏳ In Progress</Badge>;
      case 'pending': return <Badge className="bg-orange-100 text-orange-800">⏸ Pending</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-800">⚠ Overdue</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getModuleBadge = (module: string) => {
    const moduleColors: { [key: string]: string } = {
      'QA/ITP': 'bg-purple-100 text-purple-800',
      'Finance': 'bg-green-100 text-green-800',
      'Documents': 'bg-blue-100 text-blue-800',
      'Programme': 'bg-orange-100 text-orange-800',
      'Tasks': 'bg-gray-100 text-gray-800',
      'RFI': 'bg-indigo-100 text-indigo-800',
      'Variations': 'bg-red-100 text-red-800'
    };
    
    return <Badge className={moduleColors[module] || 'bg-gray-100 text-gray-800'}>{module}</Badge>;
  };

  const filteredTasks = (taskList: typeof tasks) => {
    return taskList.filter(task => {
      const matchesProject = filterProject === 'all' || task.project === filterProject;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesProject && matchesStatus && matchesSearch;
    });
  };

  const TaskCard = ({ task }: { task: typeof tasks[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <div className="flex gap-2">
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">{task.description}</p>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Building2 className="h-4 w-4" />
              {task.project}
            </div>
            {getModuleBadge(task.module)}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-4 w-4" />
              {task.assignee === user?.email ? 'Me' : task.assignee}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">Manage your tasks across all projects</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task and assign it to a project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input id="taskTitle" placeholder="Enter task title" />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea id="taskDescription" placeholder="Describe the task..." />
                </div>
                <div>
                  <Label htmlFor="taskProject">Project</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="riverside">Riverside Apartments</SelectItem>
                      <SelectItem value="commercial">Commercial Plaza</SelectItem>
                      <SelectItem value="hospital">City Hospital Wing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taskModule">Module</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qa-itp">QA/ITP</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="programme">Programme</SelectItem>
                      <SelectItem value="tasks">Tasks</SelectItem>
                      <SelectItem value="rfi">RFI</SelectItem>
                      <SelectItem value="variations">Variations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskPriority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taskDueDate">Due Date</Label>
                    <Input id="taskDueDate" type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button>Create Task</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckSquare className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-2xl font-bold">{myTasks.length}</div>
              <div className="text-sm text-gray-600">My Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-2xl font-bold">{myTasks.filter(t => t.status === 'in-progress').length}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <div className="text-2xl font-bold">{myTasks.filter(t => t.priority === 'high').length}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold">{myTasks.filter(t => new Date(t.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="Riverside Apartments">Riverside Apartments</SelectItem>
                      <SelectItem value="Commercial Plaza">Commercial Plaza</SelectItem>
                      <SelectItem value="City Hospital Wing">City Hospital Wing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="my-tasks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTasks(myTasks).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
            {filteredTasks(myTasks).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">No tasks match your current filters.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all-tasks">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTasks(allTasks).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
            {filteredTasks(allTasks).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">No tasks match your current filters.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tasks;
