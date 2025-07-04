
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
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, loading, createTask, updateTask } = useTasks();
  const { projects } = useProjects();
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium' as const,
    due_date: '',
  });

  const myTasks = tasks.filter(task => task.assigned_to === user?.id);
  const allTasks = tasks;

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'high': { bg: 'bg-red-100', text: 'text-red-800', label: 'High' },
      'medium': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
      'low': { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Normal' };
    
    return <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓', label: 'Completed' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳', label: 'In Progress' },
      'todo': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⏸', label: 'To Do' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❓', label: 'Unknown' };
    
    return <Badge className={`${config.bg} ${config.text}`}>{config.icon} {config.label}</Badge>;
  };

  const filteredTasks = (taskList: typeof tasks) => {
    return taskList.filter(task => {
      const matchesProject = filterProject === 'all' || task.project_id === filterProject;
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesProject && matchesStatus && matchesSearch;
    });
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

    const success = await createTask({
      ...newTask,
      assigned_to: user?.id,
    });

    if (success) {
      setShowCreateDialog(false);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        due_date: '',
      });
    }
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
          
          {task.description && (
            <p className="text-gray-600 text-sm">{task.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {task.project_name && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {task.project_name}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            {task.due_date && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                Due: {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-4 w-4" />
              {task.assignee_name || 'Unassigned'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
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
                  <Input 
                    id="taskTitle" 
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea 
                    id="taskDescription" 
                    placeholder="Describe the task..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taskProject">Project</Label>
                  <Select value={newTask.project_id} onValueChange={(value) => setNewTask(prev => ({ ...prev, project_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskPriority">Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}>
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
                    <Input 
                      id="taskDueDate" 
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
                    Create Task
                  </Button>
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
              <div className="text-2xl font-bold">
                {myTasks.filter(t => t.due_date && new Date(t.due_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).length}
              </div>
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
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="my-tasks">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTasks(myTasks).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
            {!loading && filteredTasks(myTasks).length === 0 && (
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
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTasks(allTasks).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
            {!loading && filteredTasks(allTasks).length === 0 && (
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
