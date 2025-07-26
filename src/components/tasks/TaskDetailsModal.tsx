import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { Calendar, User, Building, Link2, Clock, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<boolean>;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date,
    comments: task.comments,
  });

  const handleSave = async () => {
    const success = await onUpdate(task.id, editData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      comments: task.comments,
    });
    setIsEditing(false);
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'default'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      todo: 'secondary',
      'in-progress': 'default',
      completed: 'default',
      blocked: 'destructive',
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? 'Edit Task' : 'Task Details'}
              {task.task_number && (
                <Badge variant="outline">{task.task_number}</Badge>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            {isEditing ? (
              <Input
                id="title"
                value={editData.title || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
              />
            ) : (
              <p className="text-lg font-medium">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={editData.description || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description"
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground">{task.description || 'No description'}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select 
                  value={editData.status} 
                  onValueChange={(value) => setEditData(prev => ({ ...prev, status: value as Task['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                getStatusBadge(task.status)
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              {isEditing ? (
                <Select 
                  value={editData.priority} 
                  onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value as Task['priority'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                getPriorityBadge(task.priority)
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            {isEditing ? (
              <Input
                id="due_date"
                type="date"
                value={editData.due_date || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            ) : (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Project</Label>
              <div className="flex items-center text-sm">
                <Building className="h-4 w-4 mr-2" />
                {task.project_name || 'No project'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2" />
                {task.assignee_name || 'Unassigned'}
              </div>
            </div>

            {task.linked_module && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Linked Module</Label>
                <div className="flex items-center text-sm">
                  <Link2 className="h-4 w-4 mr-2" />
                  {task.linked_module}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Created</Label>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2" />
                {format(new Date(task.created_at), 'PPP')}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            {isEditing ? (
              <Textarea
                id="comments"
                value={editData.comments || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Add comments..."
                rows={3}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.comments || 'No comments'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};