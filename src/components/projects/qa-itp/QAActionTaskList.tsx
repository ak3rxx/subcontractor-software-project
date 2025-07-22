
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  FileText,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QAActionTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  due_date?: string;
  created_at: string;
  inspection_id?: string;
  inspection_reference?: string;
  task_type: 'follow-up' | 'remedial' | 'quality-check' | 'documentation' | 'other';
}

interface QAActionTaskListProps {
  projectId: string;
  className?: string;
}

const QAActionTaskList: React.FC<QAActionTaskListProps> = ({ projectId, className = "" }) => {
  const [tasks, setTasks] = useState<QAActionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<QAActionTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockTasks: QAActionTask[] = [
      {
        id: '1',
        title: 'Fix concrete finishing issues in Area B',
        description: 'Quality inspection revealed poor concrete finishing. Requires remedial work.',
        status: 'pending',
        priority: 'high',
        assignee: 'John Smith',
        due_date: '2024-01-25',
        created_at: '2024-01-15T10:00:00Z',
        inspection_id: 'qa-001',
        inspection_reference: 'QA-001-2024',
        task_type: 'remedial'
      },
      {
        id: '2',
        title: 'Update structural drawings based on inspection',
        description: 'Documentation needs updating following structural inspection findings.',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'Sarah Wilson',
        due_date: '2024-01-30',
        created_at: '2024-01-14T14:30:00Z',
        inspection_id: 'qa-002',
        inspection_reference: 'QA-002-2024',
        task_type: 'documentation'
      },
      {
        id: '3',
        title: 'Schedule re-inspection for plumbing work',
        description: 'Follow-up inspection required after plumbing corrections.',
        status: 'completed',
        priority: 'medium',
        assignee: 'Mike Johnson',
        due_date: '2024-01-20',
        created_at: '2024-01-12T09:15:00Z',
        inspection_id: 'qa-003',
        inspection_reference: 'QA-003-2024',
        task_type: 'follow-up'
      }
    ];
    setTasks(mockTasks);
    setFilteredTasks(mockTasks);
  }, [projectId]);

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.task_type === activeTab);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <CheckSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const taskTypeCounts = {
    all: tasks.length,
    'follow-up': tasks.filter(t => t.task_type === 'follow-up').length,
    'remedial': tasks.filter(t => t.task_type === 'remedial').length,
    'quality-check': tasks.filter(t => t.task_type === 'quality-check').length,
    'documentation': tasks.filter(t => t.task_type === 'documentation').length,
    'other': tasks.filter(t => t.task_type === 'other').length,
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading QA tasks...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QA Action & Task List</h2>
          <p className="text-muted-foreground">
            Manage follow-up actions and tasks generated from QA inspections
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks, descriptions, or assignees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All ({taskTypeCounts.all})
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="flex items-center gap-2">
            Follow-up ({taskTypeCounts['follow-up']})
          </TabsTrigger>
          <TabsTrigger value="remedial" className="flex items-center gap-2">
            Remedial ({taskTypeCounts.remedial})
          </TabsTrigger>
          <TabsTrigger value="quality-check" className="flex items-center gap-2">
            Quality ({taskTypeCounts['quality-check']})
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            Docs ({taskTypeCounts.documentation})
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            Other ({taskTypeCounts.other})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your filters or search criteria'
                      : 'No QA tasks have been created yet'
                    }
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create First Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-muted-foreground mb-3">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.inspection_reference && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {task.inspection_reference}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Form - Placeholder */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New QA Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Task creation form will be implemented here</p>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAActionTaskList;
