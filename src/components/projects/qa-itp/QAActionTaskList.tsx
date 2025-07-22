
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, AlertTriangle, Clock, Plus, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QAActionTaskListProps {
  projectId: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  source: 'qa_inspection' | 'manual' | 'variation' | 'rfi';
  sourceId?: string;
  category: string;
}

const QAActionTaskList: React.FC<QAActionTaskListProps> = ({ projectId }) => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchActionItems();
    }
  }, [projectId]);

  const fetchActionItems = async () => {
    try {
      setLoading(true);
      console.log('QA Action Tasks: Fetching for project:', projectId);

      // Generate mock data for now since we don't have a specific action_items table
      const mockActionItems: ActionItem[] = [
        {
          id: '1',
          title: 'Fix tiling defects in bathroom',
          description: 'Several tiles need to be re-laid due to poor adhesion',
          status: 'pending',
          priority: 'high',
          assignedTo: 'Tiling Contractor',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          source: 'qa_inspection',
          sourceId: 'qa-001',
          category: 'Defect Rectification'
        },
        {
          id: '2',
          title: 'Submit compliance certificate',
          description: 'Fire door compliance certificate required before handover',
          status: 'in_progress',
          priority: 'critical',
          assignedTo: 'Site Manager',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          source: 'qa_inspection',
          sourceId: 'qa-002',
          category: 'Documentation'
        },
        {
          id: '3',
          title: 'Complete electrical testing',
          description: 'Final electrical testing and certification required',
          status: 'pending',
          priority: 'medium',
          assignedTo: 'Electrical Contractor',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          source: 'manual',
          category: 'Testing & Commissioning'
        }
      ];

      setActionItems(mockActionItems);
      console.log('QA Action Tasks: Loaded', mockActionItems.length, 'items');
    } catch (error) {
      console.error('QA Action Tasks: Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load action items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateActionStatus = async (id: string, newStatus: ActionItem['status']) => {
    try {
      // Update local state immediately for better UX
      setActionItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status: newStatus } : item
        )
      );

      toast({
        title: "Status Updated",
        description: `Action item marked as ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating action status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredItems = actionItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const groupedItems = {
    pending: filteredItems.filter(item => item.status === 'pending'),
    in_progress: filteredItems.filter(item => item.status === 'in_progress'),
    completed: filteredItems.filter(item => item.status === 'completed'),
    overdue: filteredItems.filter(item => isOverdue(item.dueDate) && item.status !== 'completed')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading action items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">QA Actions & Tasks</h2>
          <p className="text-muted-foreground">Track and manage quality-related action items</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Action Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search action items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{groupedItems.pending.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{groupedItems.in_progress.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{groupedItems.completed.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{groupedItems.overdue.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({groupedItems.pending.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({groupedItems.in_progress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({groupedItems.completed.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({groupedItems.overdue.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Action Items</h3>
                  <p className="text-muted-foreground">No action items match your current filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                            <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={getStatusColor(item.status)}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <Badge variant="outline">{item.category}</Badge>
                              {item.source && (
                                <Badge variant="secondary">
                                  {item.source.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.assignedTo && <span>Assigned to: {item.assignedTo} • </span>}
                              {item.dueDate && (
                                <span className={isOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                                  Due: {new Date(item.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status !== 'completed' && (
                          <>
                            {item.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateActionStatus(item.id, 'in_progress')}
                              >
                                Start
                              </Button>
                            )}
                            {item.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => updateActionStatus(item.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Individual status tabs */}
        {Object.entries(groupedItems).map(([status, items]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {items.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No {status.replace('_', ' ')} Items</h3>
                    <p className="text-muted-foreground">
                      No action items with {status.replace('_', ' ')} status.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      {/* Same content as above */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                              <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline">{item.category}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.assignedTo && <span>Assigned to: {item.assignedTo} • </span>}
                                {item.dueDate && (
                                  <span className={isOverdue(item.dueDate) ? 'text-red-600 font-medium' : ''}>
                                    Due: {new Date(item.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.status !== 'completed' && (
                            <>
                              {item.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateActionStatus(item.id, 'in_progress')}
                                >
                                  Start
                                </Button>
                              )}
                              {item.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateActionStatus(item.id, 'completed')}
                                >
                                  Complete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default QAActionTaskList;
