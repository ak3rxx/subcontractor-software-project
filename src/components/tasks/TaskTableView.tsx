import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/hooks/useTasks';
import { TaskLinkedBadge } from './TaskLinkedBadge';
import { CalendarDays, Clock, User, MoreHorizontal, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useSimplePermissions } from '@/hooks/useSimplePermissions';
import { useAuth } from '@/hooks/useAuth';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface TaskTableViewProps {
  tasks: Task[];
  selectedTasks: string[];
  onSelectedTasksChange: (taskIds: string[]) => void;
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDeleteTask?: (taskId: string) => void;
  onBulkDelete?: (taskIds: string[]) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  selectedTasks,
  onSelectedTasksChange,
  onTaskClick,
  onStatusChange,
  onDeleteTask,
  onBulkDelete,
}) => {
  const { user } = useAuth();
  const permissions = useSimplePermissions();
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedTasksChange(tasks.map(task => task.id));
    } else {
      onSelectedTasksChange([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      onSelectedTasksChange([...selectedTasks, taskId]);
    } else {
      onSelectedTasksChange(selectedTasks.filter(id => id !== taskId));
    }
  };

  // Check if user can delete a specific task
  const canDeleteTask = (task: Task) => {
    if (!user || !onDeleteTask) return false;
    
    // Developers, PM/Org Admin can delete any task
    if (permissions.isDeveloper() || permissions.isOrgAdmin() || permissions.isProjectManager()) {
      return true;
    }
    
    // Subcontractors cannot delete any tasks
    if (user.roles?.some(role => role.role === 'subcontractor')) {
      return false;
    }
    
    // Other users can only delete tasks they created (not tasks assigned to them by others)
    return task.created_by === user.id;
  };

  // Check if user can delete any of the selected tasks
  const canBulkDelete = () => {
    if (!onBulkDelete || selectedTasks.length === 0) return false;
    
    const selectedTaskObjects = tasks.filter(task => selectedTasks.includes(task.id));
    return selectedTaskObjects.some(task => canDeleteTask(task));
  };

  const handleBulkDelete = () => {
    if (!onBulkDelete) return;
    
    // Only delete tasks the user has permission to delete
    const deletableTasks = tasks
      .filter(task => selectedTasks.includes(task.id) && canDeleteTask(task))
      .map(task => task.id);
    
    if (deletableTasks.length > 0) {
      onBulkDelete(deletableTasks);
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      'todo': { variant: 'secondary' as const, label: 'To Do' },
      'in-progress': { variant: 'default' as const, label: 'In Progress' },
      'completed': { variant: 'outline' as const, label: 'Completed' },
      'blocked': { variant: 'destructive' as const, label: 'Blocked' },
    };
    
    const config = variants[status] || variants.todo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const variants = {
      'low': { variant: 'outline' as const, label: 'Low' },
      'medium': { variant: 'secondary' as const, label: 'Medium' },
      'high': { variant: 'destructive' as const, label: 'High' },
    };
    
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No tasks found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            {canBulkDelete() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Tasks</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the selected tasks? This action cannot be undone.
                      {selectedTasks.length > tasks.filter(t => selectedTasks.includes(t.id) && canDeleteTask(t)).length && (
                        <div className="mt-2 p-2 bg-amber-50 rounded text-amber-800 text-sm">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          Some tasks will be skipped due to insufficient permissions.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onSelectedTasksChange([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.length === tasks.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all tasks"
                />
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="w-12 transform -rotate-12 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow 
                key={task.id} 
                className={`cursor-pointer hover:bg-muted/50 ${isOverdue(task) ? 'bg-red-50' : ''}`}
                onClick={() => onTaskClick(task)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                    aria-label={`Select task ${task.title}`}
                  />
                </TableCell>
                
                <TableCell className="max-w-[300px]">
                  <div className="space-y-1">
                    <div className="font-medium truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </div>
                    )}
                    {isOverdue(task) && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <Clock className="h-3 w-3" />
                        Overdue
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {getStatusBadge(task.status)}
                </TableCell>
                
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                
                <TableCell>
                  {task.assigned_to ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Assigned</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                
                <TableCell>
                  {task.due_date ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No due date</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {task.category || 'General'}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {task.linked_module && task.linked_id ? (
                    <TaskLinkedBadge task={task} showNavigateButton={false} />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTaskClick(task)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTaskClick(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Task
                      </DropdownMenuItem>
                      {canDeleteTask(task) && (
                        <>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteTask?.(task.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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