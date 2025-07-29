import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/hooks/useTasks';
import { TaskFileUpload } from './TaskFileUpload';
import { useTaskValidation } from '@/hooks/useTaskValidation';
import { Calendar, User, Building, Link2, Clock, Edit3, ExternalLink, MapPin, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Task>>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date,
    comments: task.comments,
    url_link: task.url_link,
    drawing_number: task.drawing_number,
    location: task.location,
  });

  const { errors, isValidating, validateField, validateAllFields, clearErrors, getFieldError, hasErrors } = useTaskValidation();

  // Reset edit data when task changes
  useEffect(() => {
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      comments: task.comments,
      url_link: task.url_link,
      drawing_number: task.drawing_number,
      location: task.location,
    });
    clearErrors();
  }, [task, clearErrors]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Validate all fields
    const isValid = await validateAllFields(editData, task.project_id);
    
    if (!isValid) {
      setIsSaving(false);
      return;
    }

    const success = await onUpdate(task.id, editData);
    if (success) {
      setIsEditing(false);
      clearErrors();
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      comments: task.comments,
      url_link: task.url_link,
      drawing_number: task.drawing_number,
      location: task.location,
    });
    setIsEditing(false);
    clearErrors();
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = async (field: string, value: string) => {
    // Only validate on blur, not on every keystroke
    if (value) {
      await validateField(field, value, task.project_id);
    }
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
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              disabled={isSaving}
            >
              <Edit3 className="h-4 w-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  id="title"
                  value={editData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  onBlur={(e) => handleFieldBlur('title', e.target.value)}
                  placeholder="Task title"
                  className={getFieldError('title') ? 'border-destructive' : ''}
                />
                {getFieldError('title') && (
                  <p className="text-sm text-destructive flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {getFieldError('title')}
                  </p>
                )}
              </div>
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
              <div className="space-y-1">
                <Input
                  id="due_date"
                  type="date"
                  value={editData.due_date || ''}
                  onChange={(e) => handleFieldChange('due_date', e.target.value)}
                  onBlur={(e) => handleFieldBlur('due_date', e.target.value)}
                  className={getFieldError('due_date') ? 'border-destructive' : ''}
                />
                {getFieldError('due_date') && (
                  <p className="text-sm text-destructive flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {getFieldError('due_date')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {task.due_date ? format(new Date(task.due_date), 'PPP') : 'No due date'}
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={editData.location || ''}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="e.g., Building A, Level 2"
                />
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {task.location || 'No location specified'}
                </div>
              )}
            </div>

            {/* Drawing Number */}
            <div className="space-y-2">
              <Label htmlFor="drawing_number">Drawing Number</Label>
              {isEditing ? (
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      id="drawing_number"
                      value={editData.drawing_number || ''}
                      onChange={(e) => handleFieldChange('drawing_number', e.target.value)}
                      onBlur={(e) => handleFieldBlur('drawing_number', e.target.value)}
                      placeholder="e.g., DRG-001"
                      className={getFieldError('drawing_number') ? 'border-destructive' : ''}
                    />
                    {isValidating && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {getFieldError('drawing_number') && (
                    <p className="text-sm text-destructive flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      {getFieldError('drawing_number')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  {task.drawing_number ? (
                    <div className="flex items-center">
                      <span>{task.drawing_number}</span>
                      <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                    </div>
                  ) : (
                    'No drawing reference'
                  )}
                </div>
              )}
            </div>
          </div>

          {/* URL Link */}
          <div className="space-y-2">
            <Label htmlFor="url_link">URL Link</Label>
            {isEditing ? (
              <div className="space-y-1">
                <Input
                  id="url_link"
                  type="url"
                  value={editData.url_link || ''}
                  onChange={(e) => handleFieldChange('url_link', e.target.value)}
                  onBlur={(e) => handleFieldBlur('url_link', e.target.value)}
                  placeholder="https://example.com"
                  className={getFieldError('url_link') ? 'border-destructive' : ''}
                />
                {getFieldError('url_link') && (
                  <p className="text-sm text-destructive flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {getFieldError('url_link')}
                  </p>
                )}
              </div>
            ) : task.url_link ? (
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                <a 
                  href={task.url_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {task.url_link}
                </a>
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <ExternalLink className="h-4 w-4 mr-2" />
                No URL provided
              </div>
            )}
          </div>

          {/* Enhanced File Upload/Management */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <TaskFileUpload
              taskId={task.id}
              projectId={task.project_id || ''}
              existingFiles={task.attachments || []}
              isEditing={isEditing}
              onFilesChange={(files) => {
                setEditData(prev => ({ ...prev, attachments: files }));
              }}
            />
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

            {task.category && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div className="flex items-center text-sm">
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
              </div>
            )}

            {task.reference_number && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Reference</Label>
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {task.reference_number}
                </div>
              </div>
            )}
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
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || hasErrors}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}

          {/* Validation Summary */}
          {isEditing && hasErrors && (
            <div className="flex items-center justify-center p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Please fix the validation errors above before saving</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};